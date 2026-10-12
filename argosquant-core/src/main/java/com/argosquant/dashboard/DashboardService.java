package com.argosquant.dashboard;

import com.argosquant.database.Jdbc;
import com.argosquant.exceptions.ResourceNotFoundException;
import com.argosquant.market.Quote;
import com.argosquant.market.service.MarketDataService;
import com.argosquant.model.Holding;
import com.argosquant.model.Portfolio;
import com.argosquant.model.asset.Equity;
import com.argosquant.model.asset.FinancialAsset;
import com.argosquant.portfolio.repository.StockRepository;
import com.argosquant.portfolio.service.PortfolioService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Read-only orchestrator for the portfolio dashboard. Loads the owner-scoped
 * holdings, resolves each instrument, values them at the latest market quote,
 * and aggregates portfolio-level totals. Never mutates state.
 *
 * <p>Lives in the business layer (not a controller) so both the web and
 * desktop clients can reuse the same aggregation.
 */
public class DashboardService {

    private static final int MONEY_SCALE = 2;

    private final Jdbc jdbc;
    private final PortfolioService portfolioService;
    private final StockRepository stocks;
    private final MarketDataService marketDataService;

    public DashboardService(Jdbc jdbc, PortfolioService portfolioService, StockRepository stocks,
                            MarketDataService marketDataService) {
        this.jdbc = jdbc;
        this.portfolioService = portfolioService;
        this.stocks = stocks;
        this.marketDataService = marketDataService;
    }

    public PortfolioDashboard load(long userId, long portfolioId) throws ResourceNotFoundException {
        Portfolio portfolio = portfolioService.get(userId, portfolioId);
        List<Holding> holdings = portfolioService.listHoldings(userId, portfolioId);

        // Resolve each holding's instrument (symbol/name/sector/type) in one connection.
        Map<Long, FinancialAsset> assets = jdbc.inConnection(conn -> {
            Map<Long, FinancialAsset> resolved = new HashMap<>();
            for (Holding h : holdings) {
                if (!resolved.containsKey(h.stockId())) {
                    stocks.findById(conn, h.stockId()).ifPresent(a -> resolved.put(h.stockId(), a));
                }
            }
            return resolved;
        });

        // Fetch quotes concurrently for all held symbols.
        List<String> symbols = new ArrayList<>();
        for (Holding h : holdings) {
            FinancialAsset a = assets.get(h.stockId());
            if (a != null) {
                symbols.add(a.symbol());
            }
        }
        Map<String, Quote> quotes = symbols.isEmpty() ? Map.of() : marketDataService.getQuotes(symbols);

        // First pass: value each position and accumulate totals.
        BigDecimal totalValue = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        Map<Holding, BigDecimal> marketValues = new LinkedHashMap<>();
        for (Holding h : holdings) {
            FinancialAsset a = assets.get(h.stockId());
            Quote q = a == null ? null : quotes.get(a.symbol());
            BigDecimal costBasis = h.costBasis();
            totalCost = totalCost.add(costBasis);
            BigDecimal marketValue = q == null ? null : h.quantity().multiply(q.price());
            marketValues.put(h, marketValue);
            if (marketValue != null) {
                totalValue = totalValue.add(marketValue);
            }
        }

        // Second pass: build enriched rows now that totalValue is known (for weights).
        List<DashboardHolding> rows = new ArrayList<>(holdings.size());
        for (Holding h : holdings) {
            FinancialAsset a = assets.get(h.stockId());
            Quote q = a == null ? null : quotes.get(a.symbol());
            BigDecimal costBasis = h.costBasis();
            BigDecimal marketValue = marketValues.get(h);
            BigDecimal currentPrice = q == null ? null : q.price();
            BigDecimal pnl = marketValue == null ? null : marketValue.subtract(costBasis);
            double pnlPct = (pnl == null || costBasis.signum() == 0)
                    ? 0.0
                    : pnl.divide(costBasis, 6, RoundingMode.HALF_UP).doubleValue();
            double weight = (marketValue == null || totalValue.signum() == 0)
                    ? 0.0
                    : marketValue.divide(totalValue, 6, RoundingMode.HALF_UP).doubleValue();
            String symbol = a == null ? ("#" + h.stockId()) : a.symbol();
            String name = a == null ? symbol : a.name();
            String sector = (a instanceof Equity e) ? e.sector() : null;
            rows.add(new DashboardHolding(
                    symbol, name, sector,
                    a == null ? null : a.type(),
                    h.quantity(),
                    h.avgCost(),
                    scale(costBasis),
                    currentPrice,
                    scale(marketValue),
                    scale(pnl),
                    pnlPct,
                    weight));
        }

        double totalPnlPct = totalCost.signum() == 0
                ? 0.0
                : totalValue.subtract(totalCost).divide(totalCost, 6, RoundingMode.HALF_UP).doubleValue();

        return new PortfolioDashboard(
                portfolioId,
                portfolio.name(),
                portfolio.baseCurrency(),
                scale(totalValue),
                scale(totalCost),
                scale(totalValue.subtract(totalCost)),
                totalPnlPct,
                holdings.size(),
                rows);
    }

    private static BigDecimal scale(BigDecimal v) {
        return v == null ? null : v.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }
}

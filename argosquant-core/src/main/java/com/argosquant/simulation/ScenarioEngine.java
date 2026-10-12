package com.argosquant.simulation;

import com.argosquant.database.Jdbc;
import com.argosquant.exceptions.ResourceNotFoundException;
import com.argosquant.market.Quote;
import com.argosquant.market.service.MarketDataService;
import com.argosquant.model.Holding;
import com.argosquant.model.asset.Equity;
import com.argosquant.model.asset.FinancialAsset;
import com.argosquant.portfolio.repository.HoldingRepository;
import com.argosquant.portfolio.repository.StockRepository;
import com.argosquant.portfolio.service.PortfolioService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Computes the hypothetical impact of a price-shock scenario on a portfolio,
 * using real holdings and live market prices. Strictly read-only: it reads
 * positions and quotes and returns a computed {@link ScenarioResult} — it never
 * writes to the holdings or transactions tables.
 */
public class ScenarioEngine {

    private static final int MONEY_SCALE = 2;

    private final Jdbc jdbc;
    private final PortfolioService portfolioService;
    private final HoldingRepository holdings;
    private final StockRepository stocks;
    private final MarketDataService marketDataService;

    public ScenarioEngine(Jdbc jdbc, PortfolioService portfolioService, HoldingRepository holdings,
                          StockRepository stocks, MarketDataService marketDataService) {
        this.jdbc = jdbc;
        this.portfolioService = portfolioService;
        this.holdings = holdings;
        this.stocks = stocks;
        this.marketDataService = marketDataService;
    }

    public ScenarioResult run(long userId, long portfolioId, ScenarioDefinition scenario)
            throws ResourceNotFoundException {
        portfolioService.get(userId, portfolioId); // enforce ownership

        List<Position> positions = loadPositions(portfolioId);
        if (positions.isEmpty()) {
            BigDecimal zero = money(BigDecimal.ZERO);
            return new ScenarioResult(scenario.name(), zero, zero, zero, 0.0, List.of());
        }

        Map<String, Quote> quotes = marketDataService.getQuotes(
                positions.stream().map(Position::symbol).toList());

        List<HoldingImpact> impacts = new ArrayList<>();
        BigDecimal totalCurrent = BigDecimal.ZERO;
        BigDecimal totalShocked = BigDecimal.ZERO;

        for (Position position : positions) {
            Quote quote = quotes.get(position.symbol());
            if (quote == null) {
                continue; // no price available; omit from the scenario
            }
            double shock = scenario.shockFor(position.sector(), position.symbol());
            BigDecimal currentPrice = quote.price();
            BigDecimal shockedPrice = currentPrice
                    .multiply(BigDecimal.valueOf(1.0 + shock))
                    .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

            BigDecimal currentValue = money(position.quantity().multiply(currentPrice));
            BigDecimal shockedValue = money(position.quantity().multiply(shockedPrice));
            BigDecimal impact = shockedValue.subtract(currentValue);

            impacts.add(new HoldingImpact(position.symbol(), position.quantity(), currentPrice,
                    shockedPrice, shock, currentValue, shockedValue, impact));
            totalCurrent = totalCurrent.add(currentValue);
            totalShocked = totalShocked.add(shockedValue);
        }

        BigDecimal totalImpact = totalShocked.subtract(totalCurrent);
        double percentImpact = totalCurrent.signum() == 0
                ? 0.0
                : totalImpact.divide(totalCurrent, 6, RoundingMode.HALF_UP).doubleValue();

        return new ScenarioResult(scenario.name(), money(totalCurrent), money(totalShocked),
                money(totalImpact), percentImpact, impacts);
    }

    private List<Position> loadPositions(long portfolioId) {
        return jdbc.inConnection(conn -> {
            List<Holding> rows = holdings.findByPortfolio(conn, portfolioId);
            List<Position> out = new ArrayList<>(rows.size());
            for (Holding h : rows) {
                FinancialAsset asset = stocks.findById(conn, h.stockId())
                        .orElseThrow(() -> new IllegalStateException("Holding references missing stock " + h.stockId()));
                String sector = (asset instanceof Equity equity) ? equity.sector() : null;
                out.add(new Position(asset.symbol(), sector, h.quantity()));
            }
            return out;
        });
    }

    private static BigDecimal money(BigDecimal v) {
        return v.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private record Position(String symbol, String sector, BigDecimal quantity) {
    }
}

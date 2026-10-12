package com.argosquant.risk;

import com.argosquant.analytics.returns.ReturnsCalculator;
import com.argosquant.analytics.volatility.VolatilityCalculator;
import com.argosquant.analytics.beta.BetaCalculator;
import com.argosquant.database.Jdbc;
import com.argosquant.exceptions.ResourceNotFoundException;
import com.argosquant.market.Quote;
import com.argosquant.market.client.MarketDataClient;
import com.argosquant.model.Holding;
import com.argosquant.model.asset.FinancialAsset;
import com.argosquant.portfolio.repository.HoldingRepository;
import com.argosquant.portfolio.repository.StockRepository;
import com.argosquant.portfolio.service.PortfolioService;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;

/**
 * Orchestrates portfolio-level analytics: resolves holdings, fetches each
 * symbol's price history <em>concurrently</em>, builds the portfolio equity
 * curve, and composes the risk report, risk score, benchmark comparison,
 * per-holding breakdown, and correlation matrix.
 *
 * <p>Read-only: it never mutates holdings or transactions.
 */
public class PortfolioAnalyticsService {

    private final Jdbc jdbc;
    private final PortfolioService portfolioService;
    private final HoldingRepository holdings;
    private final StockRepository stocks;
    private final MarketDataClient marketDataClient;
    private final RiskEngine riskEngine;
    private final RiskScoreService riskScoreService;
    private final CorrelationService correlationService;
    private final ReturnsCalculator returnsCalculator;
    private final VolatilityCalculator volatilityCalculator;
    private final BetaCalculator betaCalculator;
    private final ExecutorService executor;

    private final int historyDays;
    private final double riskFreeAnnual;
    private final String benchmarkSymbol;

    public PortfolioAnalyticsService(Jdbc jdbc, PortfolioService portfolioService, HoldingRepository holdings,
                                     StockRepository stocks, MarketDataClient marketDataClient, RiskEngine riskEngine,
                                     RiskScoreService riskScoreService, CorrelationService correlationService,
                                     ReturnsCalculator returnsCalculator, VolatilityCalculator volatilityCalculator,
                                     BetaCalculator betaCalculator, ExecutorService executor,
                                     int historyDays, double riskFreeAnnual, String benchmarkSymbol) {
        this.jdbc = jdbc;
        this.portfolioService = portfolioService;
        this.holdings = holdings;
        this.stocks = stocks;
        this.marketDataClient = marketDataClient;
        this.riskEngine = riskEngine;
        this.riskScoreService = riskScoreService;
        this.correlationService = correlationService;
        this.returnsCalculator = returnsCalculator;
        this.volatilityCalculator = volatilityCalculator;
        this.betaCalculator = betaCalculator;
        this.executor = executor;
        this.historyDays = historyDays;
        this.riskFreeAnnual = riskFreeAnnual;
        this.benchmarkSymbol = benchmarkSymbol;
    }

    public PortfolioAnalytics analyze(long userId, long portfolioId) throws ResourceNotFoundException {
        // Enforces ownership; throws ResourceNotFoundException if not the owner.
        portfolioService.get(userId, portfolioId);
        List<Holding> positions = jdbc.inConnection(conn -> holdings.findByPortfolio(conn, portfolioId));
        if (positions.isEmpty()) {
            return PortfolioAnalytics.empty(portfolioId, benchmarkSymbol);
        }

        // Resolve symbol + current quantity for each holding.
        List<String> symbols = new ArrayList<>();
        List<Double> quantities = new ArrayList<>();
        for (Holding h : positions) {
            FinancialAsset asset = jdbc.inConnection(conn -> stocks.findById(conn, h.stockId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Stock", h.stockId()));
            symbols.add(asset.symbol());
            quantities.add(h.quantity().doubleValue());
        }

        // Fetch all histories (holdings + benchmark) concurrently.
        Map<String, double[]> closes = fetchClosesConcurrently(symbols, benchmarkSymbol);
        double[] benchmarkCloses = closes.get(benchmarkSymbol);
        int len = minLength(closes.values());

        // Build the portfolio equity curve from current quantities valued over history.
        double[] equityCurve = new double[len];
        for (int s = 0; s < symbols.size(); s++) {
            double qty = quantities.get(s);
            double[] series = closes.get(symbols.get(s));
            int offset = series.length - len; // align to the common (most recent) window
            for (int t = 0; t < len; t++) {
                equityCurve[t] += qty * series[offset + t];
            }
        }
        double[] benchmarkWindow = tail(benchmarkCloses, len);

        RiskReport report = riskEngine.analyze(equityCurve, benchmarkWindow, riskFreeAnnual);
        RiskScore score = riskScoreService.score(report);
        double benchmarkAnnual = returnsCalculator.annualizedReturn(benchmarkWindow, RiskEngine.TRADING_DAYS);
        double excessReturn = report.annualizedReturn() - benchmarkAnnual;

        double totalValue = lastValue(equityCurve);
        List<HoldingRisk> holdingRisks = new ArrayList<>();
        List<double[]> returnSeries = new ArrayList<>();
        double[] benchReturns = returnsCalculator.simpleReturns(benchmarkWindow);
        for (int s = 0; s < symbols.size(); s++) {
            double[] series = tail(closes.get(symbols.get(s)), len);
            double[] rets = returnsCalculator.simpleReturns(series);
            returnSeries.add(rets);
            double weight = totalValue == 0 ? 0 : (quantities.get(s) * lastValue(series)) / totalValue;
            holdingRisks.add(new HoldingRisk(
                    symbols.get(s),
                    weight,
                    returnsCalculator.annualizedReturn(series, RiskEngine.TRADING_DAYS),
                    volatilityCalculator.annualizedVolatility(rets, RiskEngine.TRADING_DAYS),
                    betaCalculator.beta(rets, benchReturns)));
        }

        double[][] correlation = correlationService.correlationMatrix(returnSeries);
        return new PortfolioAnalytics(portfolioId, symbols.size(), report, score, benchmarkSymbol,
                benchmarkAnnual, excessReturn, holdingRisks, List.copyOf(symbols), correlation);
    }

    private Map<String, double[]> fetchClosesConcurrently(List<String> symbols, String benchmark) {
        Map<String, Future<double[]>> futures = new LinkedHashMap<>();
        List<String> all = new ArrayList<>(symbols);
        all.add(benchmark);
        for (String symbol : all) {
            futures.computeIfAbsent(symbol, sym ->
                    executor.submit((Callable<double[]>) () -> toCloses(marketDataClient.fetchDailyHistory(sym, historyDays))));
        }
        Map<String, double[]> result = new LinkedHashMap<>();
        for (Map.Entry<String, Future<double[]>> entry : futures.entrySet()) {
            try {
                result.put(entry.getKey(), entry.getValue().get());
            } catch (ExecutionException e) {
                throw new IllegalStateException("Failed to fetch history for " + entry.getKey()
                        + ": " + e.getCause().getMessage(), e.getCause());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Interrupted fetching price history", e);
            }
        }
        return result;
    }

    private static double[] toCloses(List<Quote> history) {
        double[] closes = new double[history.size()];
        for (int i = 0; i < closes.length; i++) {
            closes[i] = history.get(i).price().doubleValue();
        }
        return closes;
    }

    private static int minLength(Iterable<double[]> seriesList) {
        int min = Integer.MAX_VALUE;
        for (double[] s : seriesList) {
            min = Math.min(min, s.length);
        }
        return min;
    }

    private static double[] tail(double[] series, int len) {
        if (series.length == len) {
            return series;
        }
        double[] out = new double[len];
        System.arraycopy(series, series.length - len, out, 0, len);
        return out;
    }

    private static double lastValue(double[] series) {
        return series[series.length - 1];
    }
}

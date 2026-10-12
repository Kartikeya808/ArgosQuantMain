package com.argosquant.risk;

import java.util.List;

/**
 * Full analytics snapshot for a portfolio: composite risk metrics, risk score,
 * benchmark comparison, per-holding breakdown, and the inter-holding
 * correlation matrix.
 *
 * @param portfolioId               the analyzed portfolio
 * @param positions                 number of holdings analyzed
 * @param risk                      composite risk metrics (null if no positions)
 * @param score                     0–100 risk score (null if no positions)
 * @param benchmarkSymbol           benchmark used for beta/excess return
 * @param benchmarkAnnualizedReturn benchmark's annualized return
 * @param excessReturn              portfolio annualized return minus benchmark
 * @param holdings                  per-holding risk contributions
 * @param correlationSymbols        symbol order for {@code correlationMatrix}
 * @param correlationMatrix         symmetric inter-holding return correlation matrix
 */
public record PortfolioAnalytics(
        long portfolioId,
        int positions,
        RiskReport risk,
        RiskScore score,
        String benchmarkSymbol,
        double benchmarkAnnualizedReturn,
        double excessReturn,
        List<HoldingRisk> holdings,
        List<String> correlationSymbols,
        double[][] correlationMatrix) {

    /** An empty analytics result for a portfolio with no holdings. */
    public static PortfolioAnalytics empty(long portfolioId, String benchmarkSymbol) {
        return new PortfolioAnalytics(portfolioId, 0, null, null, benchmarkSymbol,
                0.0, 0.0, List.of(), List.of(), new double[0][0]);
    }
}

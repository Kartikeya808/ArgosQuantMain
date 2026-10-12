package com.argosquant.risk;

/**
 * A portfolio's quantitative risk metrics, all computed by the analytics layer
 * over a daily return/equity series (252 periods/year).
 *
 * @param annualizedReturn     geometric annualized return of the portfolio
 * @param annualizedVolatility annualized standard deviation of returns
 * @param sharpeRatio          annualized Sharpe ratio
 * @param historicalVar95      1-day 95% historical VaR (positive loss fraction)
 * @param parametricVar95      1-day 95% parametric VaR (positive loss fraction)
 * @param maxDrawdown          largest peak-to-trough decline (positive fraction)
 * @param beta                 beta versus the benchmark
 */
public record RiskReport(
        double annualizedReturn,
        double annualizedVolatility,
        double sharpeRatio,
        double historicalVar95,
        double parametricVar95,
        double maxDrawdown,
        double beta) {
}

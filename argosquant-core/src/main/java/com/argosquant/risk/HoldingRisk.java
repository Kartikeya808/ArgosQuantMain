package com.argosquant.risk;

/**
 * Per-holding risk contribution within a portfolio.
 *
 * @param symbol               instrument ticker
 * @param weight               fraction of portfolio market value (0..1)
 * @param annualizedReturn     the holding's own annualized return
 * @param annualizedVolatility the holding's own annualized volatility
 * @param beta                 the holding's beta versus the benchmark
 */
public record HoldingRisk(
        String symbol,
        double weight,
        double annualizedReturn,
        double annualizedVolatility,
        double beta) {
}

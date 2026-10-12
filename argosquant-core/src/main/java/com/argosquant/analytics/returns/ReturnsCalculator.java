package com.argosquant.analytics.returns;

/**
 * Return series and aggregate-return calculations over a price series.
 * Pure functions — no state, no I/O.
 */
public class ReturnsCalculator {

    /** Period-over-period simple returns: r[i] = p[i+1]/p[i] - 1. Output length is prices.length - 1. */
    public double[] simpleReturns(double[] prices) {
        requirePrices(prices);
        double[] out = new double[prices.length - 1];
        for (int i = 0; i < out.length; i++) {
            out[i] = prices[i + 1] / prices[i] - 1.0;
        }
        return out;
    }

    /** Continuously-compounded (log) returns: r[i] = ln(p[i+1]/p[i]). */
    public double[] logReturns(double[] prices) {
        requirePrices(prices);
        double[] out = new double[prices.length - 1];
        for (int i = 0; i < out.length; i++) {
            out[i] = Math.log(prices[i + 1] / prices[i]);
        }
        return out;
    }

    /** Total (cumulative) return over the whole series: p[last]/p[0] - 1. */
    public double totalReturn(double[] prices) {
        requirePrices(prices);
        return prices[prices.length - 1] / prices[0] - 1.0;
    }

    /**
     * Annualized (geometric) return given the number of periods per year
     * (e.g. 252 for daily prices).
     */
    public double annualizedReturn(double[] prices, int periodsPerYear) {
        requirePrices(prices);
        if (periodsPerYear <= 0) {
            throw new IllegalArgumentException("periodsPerYear must be positive");
        }
        int periods = prices.length - 1;
        double growth = prices[prices.length - 1] / prices[0];
        return Math.pow(growth, (double) periodsPerYear / periods) - 1.0;
    }

    private static void requirePrices(double[] prices) {
        if (prices == null || prices.length < 2) {
            throw new IllegalArgumentException("price series must have at least two points");
        }
    }
}

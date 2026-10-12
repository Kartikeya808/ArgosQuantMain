package com.argosquant.analytics.volatility;

import com.argosquant.analytics.StatUtils;

/** Volatility (standard deviation of returns), per-period and annualized. */
public class VolatilityCalculator {

    /** Sample standard deviation of a return series. */
    public double standardDeviation(double[] returns) {
        return StatUtils.stdDev(returns);
    }

    /** Annualized volatility: per-period stddev scaled by sqrt(periodsPerYear). */
    public double annualizedVolatility(double[] returns, int periodsPerYear) {
        if (periodsPerYear <= 0) {
            throw new IllegalArgumentException("periodsPerYear must be positive");
        }
        return standardDeviation(returns) * Math.sqrt(periodsPerYear);
    }
}

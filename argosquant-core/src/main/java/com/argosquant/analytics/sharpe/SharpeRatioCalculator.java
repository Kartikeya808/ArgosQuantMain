package com.argosquant.analytics.sharpe;

import com.argosquant.analytics.StatUtils;

/** Sharpe ratio: risk-adjusted excess return per unit of volatility. */
public class SharpeRatioCalculator {

    /** Below this stddev the series is treated as risk-free (avoids dividing by floating-point noise). */
    private static final double VOL_EPSILON = 1e-12;

    /**
     * Per-period Sharpe ratio: (mean(returns) - riskFreePerPeriod) / stdDev(returns).
     * Returns 0 when volatility is effectively zero.
     */
    public double sharpe(double[] returns, double riskFreePerPeriod) {
        double sd = StatUtils.stdDev(returns);
        if (sd < VOL_EPSILON) {
            return 0.0;
        }
        return (StatUtils.mean(returns) - riskFreePerPeriod) / sd;
    }

    /**
     * Annualized Sharpe ratio from per-period returns and an annual risk-free
     * rate. The per-period Sharpe is scaled by sqrt(periodsPerYear).
     */
    public double annualizedSharpe(double[] returns, double riskFreeAnnual, int periodsPerYear) {
        if (periodsPerYear <= 0) {
            throw new IllegalArgumentException("periodsPerYear must be positive");
        }
        double riskFreePerPeriod = riskFreeAnnual / periodsPerYear;
        return sharpe(returns, riskFreePerPeriod) * Math.sqrt(periodsPerYear);
    }
}

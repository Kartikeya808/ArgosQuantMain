package com.argosquant.analytics.var;

import com.argosquant.analytics.StatUtils;

/**
 * Value at Risk (VaR): the loss, as a positive fraction of value, not expected
 * to be exceeded at a given confidence over one period.
 */
public class ValueAtRiskCalculator {

    /**
     * Historical VaR: the empirical loss quantile of the return distribution.
     * At {@code confidence} = 0.95 this is the magnitude of the 5th-percentile
     * return. Returned as a positive number (0.03 == a 3% loss).
     */
    public double historicalVar(double[] returns, double confidence) {
        validateConfidence(confidence);
        double lowerTail = (1.0 - confidence) * 100.0; // e.g. 5.0 for 95% confidence
        double quantile = StatUtils.percentile(returns, lowerTail);
        return Math.max(0.0, -quantile);
    }

    /**
     * Parametric (variance-covariance) VaR assuming normally distributed
     * returns: VaR = -(mean + z * stdDev), where z is the lower-tail z-score.
     * Returned as a positive loss fraction.
     */
    public double parametricVar(double[] returns, double confidence) {
        validateConfidence(confidence);
        double mean = StatUtils.mean(returns);
        double sd = StatUtils.stdDev(returns);
        double z = lowerTailZScore(confidence);
        return Math.max(0.0, -(mean + z * sd));
    }

    /** Approximate inverse normal CDF (Acklam's algorithm) for the lower-tail probability 1-confidence. */
    private double lowerTailZScore(double confidence) {
        return inverseNormalCdf(1.0 - confidence);
    }

    private static void validateConfidence(double confidence) {
        if (confidence <= 0.5 || confidence >= 1.0) {
            throw new IllegalArgumentException("confidence must be in (0.5, 1.0), was " + confidence);
        }
    }

    // Peter Acklam's rational approximation of the inverse normal CDF.
    private static double inverseNormalCdf(double p) {
        final double[] a = {-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
                1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00};
        final double[] b = {-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
                6.680131188771972e+01, -1.328068155288572e+01};
        final double[] c = {-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
                -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00};
        final double[] d = {7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
                3.754408661907416e+00};
        final double pLow = 0.02425;
        final double pHigh = 1 - pLow;
        double q;
        double r;
        if (p < pLow) {
            q = Math.sqrt(-2 * Math.log(p));
            return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
                    / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
        } else if (p <= pHigh) {
            q = p - 0.5;
            r = q * q;
            return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q
                    / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
        } else {
            q = Math.sqrt(-2 * Math.log(1 - p));
            return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
                    / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
        }
    }
}

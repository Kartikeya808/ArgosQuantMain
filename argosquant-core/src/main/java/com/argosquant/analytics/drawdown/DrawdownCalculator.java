package com.argosquant.analytics.drawdown;

/** Drawdown: decline from a running peak of an equity/price curve. */
public class DrawdownCalculator {

    /**
     * Maximum drawdown: the largest peak-to-trough decline over the series,
     * as a positive fraction (0.2 == a 20% drawdown).
     */
    public double maxDrawdown(double[] equityCurve) {
        if (equityCurve == null || equityCurve.length < 2) {
            throw new IllegalArgumentException("equity curve must have at least two points");
        }
        double peak = equityCurve[0];
        double maxDd = 0.0;
        for (double value : equityCurve) {
            if (value > peak) {
                peak = value;
            }
            if (peak > 0) {
                double drawdown = (peak - value) / peak;
                if (drawdown > maxDd) {
                    maxDd = drawdown;
                }
            }
        }
        return maxDd;
    }
}

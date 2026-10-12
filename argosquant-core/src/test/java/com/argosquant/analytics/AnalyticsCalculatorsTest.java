package com.argosquant.analytics;

import com.argosquant.analytics.beta.BetaCalculator;
import com.argosquant.analytics.drawdown.DrawdownCalculator;
import com.argosquant.analytics.returns.ReturnsCalculator;
import com.argosquant.analytics.sharpe.SharpeRatioCalculator;
import com.argosquant.analytics.var.ValueAtRiskCalculator;
import com.argosquant.analytics.volatility.VolatilityCalculator;
import com.argosquant.risk.CorrelationService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Deterministic tests of the pure analytics calculators against hand-computed values. */
class AnalyticsCalculatorsTest {

    private static final double EPS = 1e-9;

    @Test
    void simpleReturnsAndTotalReturn() {
        ReturnsCalculator calc = new ReturnsCalculator();
        double[] prices = {100, 110, 121};
        double[] returns = calc.simpleReturns(prices);
        assertEquals(2, returns.length);
        assertEquals(0.10, returns[0], EPS);
        assertEquals(0.10, returns[1], EPS);
        assertEquals(0.21, calc.totalReturn(prices), EPS);
    }

    @Test
    void annualizedReturnCompoundsByPeriodsPerYear() {
        ReturnsCalculator calc = new ReturnsCalculator();
        // One period of +10% over 1 step; with 2 periods/year -> (1.1)^2 - 1 = 0.21.
        double[] prices = {100, 110};
        assertEquals(0.21, calc.annualizedReturn(prices, 2), 1e-9);
    }

    @Test
    void standardDeviationMatchesSampleFormula() {
        VolatilityCalculator calc = new VolatilityCalculator();
        // returns {0.1, 0.2, 0.3}: mean 0.2, sample var = (0.01+0+0.01)/2 = 0.01, sd = 0.1
        double sd = calc.standardDeviation(new double[]{0.1, 0.2, 0.3});
        assertEquals(0.1, sd, EPS);
        assertEquals(0.1 * Math.sqrt(252), calc.annualizedVolatility(new double[]{0.1, 0.2, 0.3}, 252), 1e-9);
    }

    @Test
    void sharpeZeroWhenVolatilityZero() {
        SharpeRatioCalculator calc = new SharpeRatioCalculator();
        assertEquals(0.0, calc.sharpe(new double[]{0.05, 0.05, 0.05}, 0.0), EPS);
    }

    @Test
    void betaIsOneAgainstItself() {
        BetaCalculator calc = new BetaCalculator();
        double[] market = {0.01, -0.02, 0.03, 0.00, 0.015};
        assertEquals(1.0, calc.beta(market, market), 1e-9);
    }

    @Test
    void betaDoublesWhenAssetMovesTwiceTheMarket() {
        BetaCalculator calc = new BetaCalculator();
        double[] market = {0.01, -0.02, 0.03, 0.00, 0.015};
        double[] asset = new double[market.length];
        for (int i = 0; i < market.length; i++) {
            asset[i] = 2 * market[i];
        }
        assertEquals(2.0, calc.beta(asset, market), 1e-9);
    }

    @Test
    void maxDrawdownFindsLargestPeakToTrough() {
        DrawdownCalculator calc = new DrawdownCalculator();
        // peak 120 -> trough 60 = 50% drawdown
        double[] equity = {100, 120, 90, 60, 80};
        assertEquals(0.5, calc.maxDrawdown(equity), EPS);
    }

    @Test
    void historicalVarIsLowerTailLoss() {
        ValueAtRiskCalculator calc = new ValueAtRiskCalculator();
        double[] returns = {-0.10, -0.05, 0.00, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08};
        double var95 = calc.historicalVar(returns, 0.95);
        // 5th percentile of this sample sits in the loss region; VaR must be a positive loss.
        assertTrue(var95 > 0, "expected positive VaR, got " + var95);
        assertTrue(var95 <= 0.10 + EPS);
    }

    @Test
    void parametricVarIsPositiveForVolatileSeries() {
        ValueAtRiskCalculator calc = new ValueAtRiskCalculator();
        double[] returns = {-0.03, -0.01, 0.00, 0.01, 0.02, -0.02, 0.015};
        assertTrue(calc.parametricVar(returns, 0.95) > 0);
    }

    @Test
    void correlationIsOneForIdenticalSeriesAndNegativeForInverse() {
        CorrelationService calc = new CorrelationService();
        double[] a = {0.01, 0.02, -0.01, 0.03};
        double[] inverse = {-0.01, -0.02, 0.01, -0.03};
        assertEquals(1.0, calc.correlation(a, a), 1e-9);
        assertEquals(-1.0, calc.correlation(a, inverse), 1e-9);
    }

    @Test
    void varianceRejectsTooFewObservations() {
        assertThrows(IllegalArgumentException.class, () -> StatUtils.variance(new double[]{0.1}));
    }
}

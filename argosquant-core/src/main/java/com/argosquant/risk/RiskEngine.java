package com.argosquant.risk;

import com.argosquant.analytics.beta.BetaCalculator;
import com.argosquant.analytics.drawdown.DrawdownCalculator;
import com.argosquant.analytics.returns.ReturnsCalculator;
import com.argosquant.analytics.sharpe.SharpeRatioCalculator;
import com.argosquant.analytics.var.ValueAtRiskCalculator;
import com.argosquant.analytics.volatility.VolatilityCalculator;

/**
 * Composes the individual analytics calculators into a single {@link RiskReport}
 * for a portfolio. This is where the per-concern analytics outputs are
 * assembled; the calculators themselves stay independent and pure.
 */
public class RiskEngine {

    /** Trading days per year, used to annualize daily statistics. */
    public static final int TRADING_DAYS = 252;
    private static final double VAR_CONFIDENCE = 0.95;

    private final ReturnsCalculator returns;
    private final VolatilityCalculator volatility;
    private final SharpeRatioCalculator sharpe;
    private final ValueAtRiskCalculator var;
    private final DrawdownCalculator drawdown;
    private final BetaCalculator beta;

    public RiskEngine(ReturnsCalculator returns, VolatilityCalculator volatility, SharpeRatioCalculator sharpe,
                      ValueAtRiskCalculator var, DrawdownCalculator drawdown, BetaCalculator beta) {
        this.returns = returns;
        this.volatility = volatility;
        this.sharpe = sharpe;
        this.var = var;
        this.drawdown = drawdown;
        this.beta = beta;
    }

    /**
     * Builds a risk report from a portfolio equity curve and an aligned
     * benchmark price series.
     *
     * @param equityCurve      portfolio value per period (oldest first)
     * @param benchmarkPrices  benchmark price per period (same length)
     * @param riskFreeAnnual   annual risk-free rate (e.g. 0.065)
     */
    public RiskReport analyze(double[] equityCurve, double[] benchmarkPrices, double riskFreeAnnual) {
        double[] portfolioReturns = returns.simpleReturns(equityCurve);
        double[] benchmarkReturns = returns.simpleReturns(benchmarkPrices);

        return new RiskReport(
                returns.annualizedReturn(equityCurve, TRADING_DAYS),
                volatility.annualizedVolatility(portfolioReturns, TRADING_DAYS),
                sharpe.annualizedSharpe(portfolioReturns, riskFreeAnnual, TRADING_DAYS),
                var.historicalVar(portfolioReturns, VAR_CONFIDENCE),
                var.parametricVar(portfolioReturns, VAR_CONFIDENCE),
                drawdown.maxDrawdown(equityCurve),
                beta.beta(portfolioReturns, benchmarkReturns));
    }
}

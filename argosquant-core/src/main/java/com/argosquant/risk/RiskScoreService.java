package com.argosquant.risk;

/**
 * Maps a {@link RiskReport} to a single 0–100 risk score and qualitative band.
 *
 * <p>The score blends annualized volatility, 95% VaR, and max drawdown — each
 * normalized against a reference level and capped — so no single metric
 * dominates. This is a deterministic, explainable heuristic (not a model);
 * weights/reference levels are documented inline for tuning.
 */
public class RiskScoreService {

    // Reference levels that map to a "full" contribution for each component.
    private static final double VOL_REFERENCE = 0.40;       // 40% annualized vol -> max vol contribution
    private static final double VAR_REFERENCE = 0.05;       // 5% 1-day VaR -> max VaR contribution
    private static final double DRAWDOWN_REFERENCE = 0.50;  // 50% max drawdown -> max drawdown contribution

    // Component weights (sum to 1.0).
    private static final double VOL_WEIGHT = 0.4;
    private static final double VAR_WEIGHT = 0.3;
    private static final double DRAWDOWN_WEIGHT = 0.3;

    public RiskScore score(RiskReport report) {
        double volComponent = clamp01(report.annualizedVolatility() / VOL_REFERENCE);
        double varComponent = clamp01(report.historicalVar95() / VAR_REFERENCE);
        double ddComponent = clamp01(report.maxDrawdown() / DRAWDOWN_REFERENCE);

        double weighted = VOL_WEIGHT * volComponent
                + VAR_WEIGHT * varComponent
                + DRAWDOWN_WEIGHT * ddComponent;
        int score = (int) Math.round(weighted * 100);

        RiskRating rating = rate(score);
        String rationale = String.format(
                "Vol %.1f%% (ann.), 95%% VaR %.2f%%/day, max drawdown %.1f%% -> %s risk",
                report.annualizedVolatility() * 100,
                report.historicalVar95() * 100,
                report.maxDrawdown() * 100,
                rating);
        return new RiskScore(score, rating, rationale);
    }

    private static RiskRating rate(int score) {
        if (score < 25) {
            return RiskRating.LOW;
        } else if (score < 50) {
            return RiskRating.MODERATE;
        } else if (score < 75) {
            return RiskRating.HIGH;
        }
        return RiskRating.VERY_HIGH;
    }

    private static double clamp01(double v) {
        if (v < 0) {
            return 0;
        }
        return Math.min(v, 1.0);
    }
}

package com.argosquant.analytics.beta;

import com.argosquant.analytics.StatUtils;

/** Beta: sensitivity of an asset's returns to the market/benchmark returns. */
public class BetaCalculator {

    /**
     * Beta = cov(asset, market) / var(market). The two return series must be
     * aligned and the same length. Returns 0 if the market has zero variance.
     */
    public double beta(double[] assetReturns, double[] marketReturns) {
        double marketVar = StatUtils.variance(marketReturns);
        if (marketVar == 0.0) {
            return 0.0;
        }
        return StatUtils.covariance(assetReturns, marketReturns) / marketVar;
    }
}

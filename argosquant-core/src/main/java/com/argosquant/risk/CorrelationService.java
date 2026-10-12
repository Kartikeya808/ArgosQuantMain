package com.argosquant.risk;

import com.argosquant.analytics.StatUtils;

import java.util.List;

/** Pearson correlation between return series, and full correlation matrices. */
public class CorrelationService {

    /** Pearson correlation of two aligned return series. Returns 0 if either is flat. */
    public double correlation(double[] a, double[] b) {
        double sdA = StatUtils.stdDev(a);
        double sdB = StatUtils.stdDev(b);
        if (sdA == 0.0 || sdB == 0.0) {
            return 0.0;
        }
        return StatUtils.covariance(a, b) / (sdA * sdB);
    }

    /**
     * Symmetric correlation matrix for a list of equal-length return series.
     * Element [i][j] is the correlation of series i and j; the diagonal is 1.
     */
    public double[][] correlationMatrix(List<double[]> series) {
        int n = series.size();
        double[][] matrix = new double[n][n];
        for (int i = 0; i < n; i++) {
            matrix[i][i] = 1.0;
            for (int j = i + 1; j < n; j++) {
                double c = correlation(series.get(i), series.get(j));
                matrix[i][j] = c;
                matrix[j][i] = c;
            }
        }
        return matrix;
    }
}

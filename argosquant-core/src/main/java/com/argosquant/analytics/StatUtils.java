package com.argosquant.analytics;

import java.util.Arrays;

/**
 * Small statistics helpers shared by the analytics calculators. Sample
 * statistics (n-1 denominator) are used throughout, matching standard finance
 * convention for estimating volatility from a return sample.
 */
public final class StatUtils {

    private StatUtils() {
    }

    public static double mean(double[] xs) {
        requireNonEmpty(xs);
        double sum = 0;
        for (double x : xs) {
            sum += x;
        }
        return sum / xs.length;
    }

    /** Sample variance (divides by n-1). Requires at least two observations. */
    public static double variance(double[] xs) {
        requireAtLeast(xs, 2);
        double mean = mean(xs);
        double sumSq = 0;
        for (double x : xs) {
            double d = x - mean;
            sumSq += d * d;
        }
        return sumSq / (xs.length - 1);
    }

    public static double stdDev(double[] xs) {
        return Math.sqrt(variance(xs));
    }

    /** Sample covariance (divides by n-1). The two series must be the same length (>= 2). */
    public static double covariance(double[] a, double[] b) {
        requireAtLeast(a, 2);
        if (a.length != b.length) {
            throw new IllegalArgumentException("series must be the same length: " + a.length + " vs " + b.length);
        }
        double meanA = mean(a);
        double meanB = mean(b);
        double sum = 0;
        for (int i = 0; i < a.length; i++) {
            sum += (a[i] - meanA) * (b[i] - meanB);
        }
        return sum / (a.length - 1);
    }

    /**
     * Percentile via linear interpolation between closest ranks (the same
     * method as NumPy's default). {@code p} is in [0, 100].
     */
    public static double percentile(double[] xs, double p) {
        requireNonEmpty(xs);
        if (p < 0 || p > 100) {
            throw new IllegalArgumentException("percentile must be in [0,100], was " + p);
        }
        double[] sorted = xs.clone();
        Arrays.sort(sorted);
        if (sorted.length == 1) {
            return sorted[0];
        }
        double rank = (p / 100.0) * (sorted.length - 1);
        int lo = (int) Math.floor(rank);
        int hi = (int) Math.ceil(rank);
        if (lo == hi) {
            return sorted[lo];
        }
        double weight = rank - lo;
        return sorted[lo] * (1 - weight) + sorted[hi] * weight;
    }

    private static void requireNonEmpty(double[] xs) {
        if (xs == null || xs.length == 0) {
            throw new IllegalArgumentException("series must be non-empty");
        }
    }

    private static void requireAtLeast(double[] xs, int n) {
        if (xs == null || xs.length < n) {
            throw new IllegalArgumentException("series must have at least " + n + " observations");
        }
    }
}

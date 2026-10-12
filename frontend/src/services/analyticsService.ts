/* =====================================================================
   Analytics service — performance analytics & return series. Mirrors the
   planned backend `analytics/` package outputs.
   ===================================================================== */

import type {
  MonthlyReturn,
  PerformanceAnalytics,
  PerformanceSeries,
  ReturnBucket,
  SeriesPoint,
} from "@/types";
import {
  cumulativeReturn,
  monthlyReturns,
  performance,
  performanceAnalytics,
  returnDistribution,
  rollingVolatility,
} from "@/data/mockData";

export function getPerformanceAnalytics(): PerformanceAnalytics {
  return performanceAnalytics;
}

export function getPerformanceSeries(): PerformanceSeries {
  return performance;
}

export function getCumulativeReturn(): SeriesPoint[] {
  return cumulativeReturn;
}

export function getMonthlyReturns(): MonthlyReturn[] {
  return monthlyReturns;
}

export function getReturnDistribution(): ReturnBucket[] {
  return returnDistribution;
}

export function getRollingVolatility(): SeriesPoint[] {
  return rollingVolatility;
}

/* =====================================================================
   Risk service — risk metrics, contribution, drawdown, correlation.
   Mirrors the planned backend `risk/` package (composes analytics/).
   ===================================================================== */

import type {
  CorrelationMatrix,
  RiskContribution,
  RiskMetrics,
  SeriesPoint,
} from "@/types";
import {
  correlationMatrix,
  drawdownSeries,
  riskContributions,
  riskMetrics,
  rollingVolatility,
} from "@/data/mockData";
import {
  isLive,
  liveCorrelationMatrix,
  liveRiskContributions,
  liveRiskMetrics,
} from "@/services/session";

export function getRiskMetrics(): RiskMetrics {
  return isLive() ? liveRiskMetrics() : riskMetrics;
}

export function getRiskContributions(): RiskContribution[] {
  if (isLive()) {
    const live = liveRiskContributions();
    if (live.length) return live;
  }
  return riskContributions;
}

export function getDrawdownSeries(): SeriesPoint[] {
  return drawdownSeries;
}

export function getRollingVolatility(): SeriesPoint[] {
  return rollingVolatility;
}

export function getCorrelationMatrix(): CorrelationMatrix {
  if (isLive()) {
    const live = liveCorrelationMatrix();
    if (live) return live;
  }
  return correlationMatrix;
}

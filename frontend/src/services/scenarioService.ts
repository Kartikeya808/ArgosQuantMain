/* =====================================================================
   Scenario service — stress-testing presets + deterministic execution.
   Mirrors the planned backend `simulation/` package (read-only; never
   mutates holdings).
   ===================================================================== */

import type { ScenarioInput, ScenarioPreset, ScenarioResult } from "@/types";
import { getHoldings } from "./portfolioService";
import { getRiskMetrics } from "./riskService";
import { runScenario as computeScenario } from "@/lib/scenario";
import { scenarioPresets, sectors } from "@/data/mockData";

export function getPresets(): ScenarioPreset[] {
  return scenarioPresets;
}

export function getSectors(): string[] {
  return sectors;
}

export function runScenario(input: ScenarioInput): ScenarioResult {
  return computeScenario(input, getHoldings(), getRiskMetrics());
}

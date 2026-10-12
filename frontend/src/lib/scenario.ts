/* =====================================================================
   Deterministic stress-test / scenario engine (frontend mirror of the
   planned backend `simulation/` package). Computes hypothetical impact
   from real portfolio + market data. NEVER mutates holdings — it returns
   a fresh ScenarioResult the UI renders read-only.
   ===================================================================== */

import type {
  Holding,
  RiskMetrics,
  ScenarioImpactRow,
  ScenarioInput,
  ScenarioResult,
} from "@/types";

/** Which holdings a scenario's shock applies to, as a 0..1 factor each. */
function shockFactor(input: ScenarioInput, h: Holding): number {
  switch (input.type) {
    case "STOCK":
      return h.symbol === input.target ? 1 : 0;
    case "SECTOR":
      return h.sector === input.target ? 1 : 0;
    case "MARKET":
    case "HISTORICAL":
      // whole-portfolio shock, scaled by beta-like sensitivity (approx 1)
      return 1;
    case "ALLOCATION":
      return 1;
    default:
      return 0;
  }
}

export function runScenario(
  input: ScenarioInput,
  holdings: Holding[],
  risk: RiskMetrics
): ScenarioResult {
  const currentValue = holdings.reduce((s, h) => s + h.value, 0);

  const rows: ScenarioImpactRow[] = holdings.map((h) => {
    const factor = shockFactor(input, h);
    const applied = input.shockPct * factor;
    const newValue = h.value * (1 + applied / 100);
    return {
      symbol: h.symbol,
      company: h.company,
      sector: h.sector,
      weight: h.weight,
      currentValue: h.value,
      shockPct: applied,
      newValue,
      impact: newValue - h.value,
    };
  });

  const newValue = rows.reduce((s, r) => s + r.newValue, 0);
  const estimatedImpact = newValue - currentValue;
  const impactPct = (estimatedImpact / currentValue) * 100;

  // How much of the portfolio was actually hit (value-weighted exposure).
  const exposure =
    rows.reduce((s, r) => s + (r.shockPct !== 0 ? r.currentValue : 0), 0) /
    (currentValue || 1);

  // Stress nudges the risk metrics proportionally to the shock & exposure.
  const sev = (Math.abs(input.shockPct) / 100) * exposure;
  const after = {
    volatility: Number((risk.volatility * (1 + sev * 1.4)).toFixed(1)),
    var95: Number((risk.var95 * (1 + sev * 1.8)).toFixed(1)),
    beta: Number((risk.beta * (1 + sev * 0.5)).toFixed(2)),
    riskScore: Math.min(100, Math.round(risk.score * (1 + sev * 0.9))),
  };

  return {
    input,
    currentValue,
    newValue,
    estimatedImpact,
    impactPct,
    rows: rows
      .filter((r) => r.shockPct !== 0)
      .sort((a, b) => a.impact - b.impact),
    before: {
      volatility: risk.volatility,
      var95: risk.var95,
      beta: risk.beta,
      riskScore: risk.score,
    },
    after,
  };
}

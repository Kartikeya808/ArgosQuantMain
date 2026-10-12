package com.argosquant.simulation;

import java.math.BigDecimal;
import java.util.List;

/**
 * Result of running a {@link ScenarioDefinition} against a portfolio: the
 * aggregate value impact plus a per-holding breakdown. Purely computed — the
 * portfolio itself is never modified.
 *
 * @param scenarioName   the scenario's name
 * @param currentValue   portfolio market value now
 * @param shockedValue   portfolio value under the scenario
 * @param absoluteImpact shockedValue − currentValue (negative = loss)
 * @param percentImpact  absoluteImpact / currentValue (decimal fraction)
 * @param holdings       per-holding impacts
 */
public record ScenarioResult(
        String scenarioName,
        BigDecimal currentValue,
        BigDecimal shockedValue,
        BigDecimal absoluteImpact,
        double percentImpact,
        List<HoldingImpact> holdings) {
}

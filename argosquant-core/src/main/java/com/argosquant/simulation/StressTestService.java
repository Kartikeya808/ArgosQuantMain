package com.argosquant.simulation;

import com.argosquant.exceptions.ResourceNotFoundException;

import java.util.List;

/**
 * Runs a standard battery of stress scenarios against a portfolio via the
 * {@link ScenarioEngine}. Read-only, like the engine it delegates to.
 */
public class StressTestService {

    private final ScenarioEngine scenarioEngine;

    public StressTestService(ScenarioEngine scenarioEngine) {
        this.scenarioEngine = scenarioEngine;
    }

    /** The built-in stress scenarios run by {@link #runStandard}. */
    public static List<ScenarioDefinition> standardScenarios() {
        return List.of(
                ScenarioDefinition.market("Market -10%", -0.10),
                ScenarioDefinition.market("Market -20% (correction)", -0.20),
                ScenarioDefinition.market("Market -35% (crash)", -0.35),
                ScenarioDefinition.market("Market +10% (rally)", 0.10),
                ScenarioDefinition.sector("IT sector -15%", "IT", -0.15));
    }

    public List<ScenarioResult> runStandard(long userId, long portfolioId) throws ResourceNotFoundException {
        List<ScenarioResult> results = new java.util.ArrayList<>();
        for (ScenarioDefinition scenario : standardScenarios()) {
            results.add(scenarioEngine.run(userId, portfolioId, scenario));
        }
        return results;
    }
}

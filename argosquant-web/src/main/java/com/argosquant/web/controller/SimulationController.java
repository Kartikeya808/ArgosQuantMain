package com.argosquant.web.controller;

import com.argosquant.exceptions.ResourceNotFoundException;
import com.argosquant.simulation.ScenarioDefinition;
import com.argosquant.simulation.ScenarioEngine;
import com.argosquant.simulation.ScenarioResult;
import com.argosquant.simulation.StressTestService;
import com.argosquant.web.security.CurrentUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * What-if scenario and stress-test endpoints. Read-only: results are computed
 * from real holdings + live prices and never persisted.
 */
@RestController
@RequestMapping("/api/portfolios/{portfolioId}/simulation")
public class SimulationController {

    private final ScenarioEngine scenarioEngine;
    private final StressTestService stressTestService;

    public SimulationController(ScenarioEngine scenarioEngine, StressTestService stressTestService) {
        this.scenarioEngine = scenarioEngine;
        this.stressTestService = stressTestService;
    }

    /** Run a custom what-if scenario (market/sector/symbol shocks). */
    @PostMapping("/scenario")
    public ScenarioResult scenario(@PathVariable long portfolioId, @RequestBody ScenarioDefinition scenario)
            throws ResourceNotFoundException {
        return scenarioEngine.run(CurrentUser.userId(), portfolioId, scenario);
    }

    /** Run the standard battery of stress scenarios. */
    @GetMapping("/stress-tests")
    public List<ScenarioResult> stressTests(@PathVariable long portfolioId) throws ResourceNotFoundException {
        return stressTestService.runStandard(CurrentUser.userId(), portfolioId);
    }
}

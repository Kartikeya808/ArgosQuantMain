package com.argosquant.web.config;

import com.argosquant.database.Jdbc;
import com.argosquant.market.service.MarketDataService;
import com.argosquant.portfolio.repository.HoldingRepository;
import com.argosquant.portfolio.repository.StockRepository;
import com.argosquant.portfolio.service.PortfolioService;
import com.argosquant.simulation.ScenarioEngine;
import com.argosquant.simulation.StressTestService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Wires the read-only scenario/stress-test services. */
@Configuration
public class SimulationConfig {

    @Bean
    public ScenarioEngine scenarioEngine(Jdbc jdbc, PortfolioService portfolioService, HoldingRepository holdings,
                                         StockRepository stocks, MarketDataService marketDataService) {
        return new ScenarioEngine(jdbc, portfolioService, holdings, stocks, marketDataService);
    }

    @Bean
    public StressTestService stressTestService(ScenarioEngine scenarioEngine) {
        return new StressTestService(scenarioEngine);
    }
}

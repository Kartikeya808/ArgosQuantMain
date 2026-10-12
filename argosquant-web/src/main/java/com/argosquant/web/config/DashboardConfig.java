package com.argosquant.web.config;

import com.argosquant.dashboard.DashboardService;
import com.argosquant.database.Jdbc;
import com.argosquant.market.service.MarketDataService;
import com.argosquant.portfolio.repository.StockRepository;
import com.argosquant.portfolio.service.PortfolioService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Wires the Phase 5 dashboard aggregation service (plain-Java, from core). */
@Configuration
public class DashboardConfig {

    @Bean
    public DashboardService dashboardService(Jdbc jdbc, PortfolioService portfolioService,
                                             StockRepository stockRepository,
                                             MarketDataService marketDataService) {
        return new DashboardService(jdbc, portfolioService, stockRepository, marketDataService);
    }
}

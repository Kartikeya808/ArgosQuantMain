package com.argosquant.web.controller;

import com.argosquant.exceptions.ResourceNotFoundException;
import com.argosquant.risk.PortfolioAnalytics;
import com.argosquant.risk.PortfolioAnalyticsService;
import com.argosquant.web.security.CurrentUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Portfolio quantitative analytics and risk (read-only, ownership-scoped). */
@RestController
@RequestMapping("/api/portfolios/{portfolioId}/analytics")
public class AnalyticsController {

    private final PortfolioAnalyticsService analyticsService;

    public AnalyticsController(PortfolioAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping
    public PortfolioAnalytics analytics(@PathVariable long portfolioId) throws ResourceNotFoundException {
        return analyticsService.analyze(CurrentUser.userId(), portfolioId);
    }
}

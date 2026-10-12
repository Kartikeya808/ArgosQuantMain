package com.argosquant.web.controller;

import com.argosquant.dashboard.DashboardService;
import com.argosquant.dashboard.PortfolioDashboard;
import com.argosquant.exceptions.ResourceNotFoundException;
import com.argosquant.web.security.CurrentUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Aggregate portfolio dashboard: live-valued holdings + portfolio totals. */
@RestController
@RequestMapping("/api/portfolios/{portfolioId}/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public PortfolioDashboard dashboard(@PathVariable long portfolioId) throws ResourceNotFoundException {
        return dashboardService.load(CurrentUser.userId(), portfolioId);
    }
}

package com.argosquant.dashboard;

import java.math.BigDecimal;
import java.util.List;

/**
 * Aggregate dashboard snapshot for one portfolio: portfolio-level totals plus
 * each position enriched with a live market valuation. Read-only; computed on
 * demand from the holdings and the market-data service.
 *
 * @param portfolioId  the portfolio analyzed
 * @param name         portfolio name
 * @param baseCurrency ISO 4217 base currency
 * @param totalValue   sum of position market values
 * @param totalCost    sum of position cost bases
 * @param totalPnl     totalValue − totalCost
 * @param totalPnlPct  totalPnl / totalCost (decimal fraction)
 * @param positions    number of holdings
 * @param holdings     per-position enriched valuations
 */
public record PortfolioDashboard(
        long portfolioId,
        String name,
        String baseCurrency,
        BigDecimal totalValue,
        BigDecimal totalCost,
        BigDecimal totalPnl,
        double totalPnlPct,
        int positions,
        List<DashboardHolding> holdings) {
}

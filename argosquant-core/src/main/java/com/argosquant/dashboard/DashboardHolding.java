package com.argosquant.dashboard;

import com.argosquant.model.AssetType;

import java.math.BigDecimal;

/**
 * A holding enriched with live valuation for the dashboard.
 *
 * @param symbol              instrument ticker
 * @param name                instrument display name
 * @param sector              GICS-style sector label (null if unclassified)
 * @param assetType           EQUITY / ETF
 * @param quantity            shares held
 * @param avgCost             average purchase price
 * @param costBasis           quantity × avgCost
 * @param currentPrice        latest market price (null if unavailable)
 * @param marketValue         quantity × currentPrice (null if price unavailable)
 * @param unrealizedPnl       marketValue − costBasis (null if price unavailable)
 * @param unrealizedPnlPct    unrealizedPnl / costBasis (decimal fraction)
 * @param weight              fraction of portfolio market value (0..1)
 */
public record DashboardHolding(
        String symbol,
        String name,
        String sector,
        AssetType assetType,
        BigDecimal quantity,
        BigDecimal avgCost,
        BigDecimal costBasis,
        BigDecimal currentPrice,
        BigDecimal marketValue,
        BigDecimal unrealizedPnl,
        double unrealizedPnlPct,
        double weight) {
}

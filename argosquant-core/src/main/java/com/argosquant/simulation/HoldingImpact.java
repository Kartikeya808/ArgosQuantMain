package com.argosquant.simulation;

import java.math.BigDecimal;

/**
 * Hypothetical impact of a scenario on one holding. All monetary figures are
 * computed, never persisted.
 *
 * @param symbol          instrument ticker
 * @param quantity        shares held (unchanged by the scenario)
 * @param currentPrice    live price before the shock
 * @param shockedPrice    price after the applied shock
 * @param appliedShockPct total shock applied (decimal fraction)
 * @param currentValue    quantity × currentPrice
 * @param shockedValue    quantity × shockedPrice
 * @param absoluteImpact  shockedValue − currentValue (negative = loss)
 */
public record HoldingImpact(
        String symbol,
        BigDecimal quantity,
        BigDecimal currentPrice,
        BigDecimal shockedPrice,
        double appliedShockPct,
        BigDecimal currentValue,
        BigDecimal shockedValue,
        BigDecimal absoluteImpact) {
}

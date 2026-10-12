package com.argosquant.model;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Net position in one instrument within a portfolio.
 *
 * <p>{@code quantity} is total shares held and {@code avgCost} the running
 * average purchase price; both use {@link BigDecimal} for exact money math.
 */
public record Holding(
        Long id,
        Long portfolioId,
        Long stockId,
        BigDecimal quantity,
        BigDecimal avgCost,
        Instant updatedAt) {

    /** Book value of the position at average cost. */
    public BigDecimal costBasis() {
        return quantity.multiply(avgCost);
    }
}

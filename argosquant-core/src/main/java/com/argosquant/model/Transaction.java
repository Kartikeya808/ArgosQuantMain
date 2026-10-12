package com.argosquant.model;

import java.math.BigDecimal;
import java.time.Instant;

/** An immutable record of an executed buy or sell. The transaction log is the source of truth for positions. */
public record Transaction(
        Long id,
        Long portfolioId,
        Long stockId,
        TransactionSide side,
        BigDecimal quantity,
        BigDecimal price,
        Instant executedAt,
        Instant createdAt) {

    /** Gross cash value of the trade (quantity × price), ignoring fees. */
    public BigDecimal grossValue() {
        return quantity.multiply(price);
    }
}

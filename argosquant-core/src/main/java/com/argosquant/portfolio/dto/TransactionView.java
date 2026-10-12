package com.argosquant.portfolio.dto;

import com.argosquant.model.TransactionSide;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * A transaction enriched with its instrument symbol/name for display. The raw
 * {@link com.argosquant.model.Transaction} carries only {@code stockId}; this
 * view resolves it so clients don't need a second lookup.
 *
 * @param id         transaction id
 * @param symbol     instrument ticker
 * @param name       instrument display name
 * @param side       BUY or SELL
 * @param quantity   shares transacted
 * @param price      execution price per share
 * @param value      quantity × price (gross)
 * @param executedAt when the trade executed
 */
public record TransactionView(
        Long id,
        String symbol,
        String name,
        TransactionSide side,
        BigDecimal quantity,
        BigDecimal price,
        BigDecimal value,
        Instant executedAt) {
}

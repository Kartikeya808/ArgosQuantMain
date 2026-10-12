package com.argosquant.portfolio.dto;

import com.argosquant.model.TransactionSide;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Request to execute a trade in a portfolio. If {@code symbol} is unknown it is
 * auto-created as a minimal equity (richer instrument data arrives in Phase 2).
 * {@code executedAt} may be null, defaulting to now.
 */
public record TradeCommand(
        TransactionSide side,
        String symbol,
        BigDecimal quantity,
        BigDecimal price,
        Instant executedAt) {
}

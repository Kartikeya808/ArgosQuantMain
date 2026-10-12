package com.argosquant.portfolio.dto;

import com.argosquant.model.Holding;
import com.argosquant.model.Transaction;

/**
 * Outcome of a trade: the recorded transaction and the resulting position.
 * {@code resultingHolding} is null when a SELL fully closed the position.
 */
public record TradeResult(Transaction transaction, Holding resultingHolding) {
}

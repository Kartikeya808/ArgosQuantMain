package com.argosquant.exceptions;

import java.math.BigDecimal;

/** Thrown when a SELL would drive a holding below zero shares. */
public class InsufficientHoldingsException extends ArgosException {

    public InsufficientHoldingsException(String symbol, BigDecimal held, BigDecimal requested) {
        super("Insufficient holdings for " + symbol + ": held " + held.toPlainString()
                + ", attempted to sell " + requested.toPlainString());
    }
}

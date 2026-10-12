package com.argosquant.exceptions;

/** Thrown when a trade is malformed (non-positive quantity/price, unknown side, etc.). */
public class InvalidTransactionException extends ArgosException {

    public InvalidTransactionException(String message) {
        super(message);
    }
}

package com.argosquant.market.client;

/**
 * Unchecked failure from a market-data provider (network error, rate limit,
 * unknown symbol). Market data is an optional enrichment, so callers can catch
 * this and degrade gracefully rather than failing core functionality.
 */
public class MarketDataException extends RuntimeException {

    public MarketDataException(String message) {
        super(message);
    }

    public MarketDataException(String message, Throwable cause) {
        super(message, cause);
    }
}

package com.argosquant.market;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * A point-in-time price for a symbol.
 *
 * @param symbol   instrument ticker (uppercase)
 * @param price    last price in {@code currency}
 * @param currency ISO currency code
 * @param asOf     when this price was observed/fetched
 */
public record Quote(String symbol, BigDecimal price, String currency, Instant asOf) {

    /** True if this quote is no older than {@code maxAgeSeconds}. */
    public boolean isFresh(long maxAgeSeconds, Instant now) {
        return asOf.plusSeconds(maxAgeSeconds).isAfter(now);
    }
}

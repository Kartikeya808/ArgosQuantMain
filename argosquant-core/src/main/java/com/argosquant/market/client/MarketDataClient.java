package com.argosquant.market.client;

import com.argosquant.market.Quote;

import java.util.List;

/**
 * Source of live market quotes. Implementations call an external provider (or
 * simulate one). This is the single seam behind which the TBD provider lives —
 * callers depend only on this interface.
 */
public interface MarketDataClient {

    /**
     * Fetches the latest quote for a symbol.
     *
     * @throws MarketDataException if the provider is unreachable or returns no data
     */
    Quote fetchQuote(String symbol) throws MarketDataException;

    /**
     * Fetches an ascending (oldest-first) daily close history for a symbol,
     * used by the analytics/risk layer which needs a price series rather than a
     * single spot price.
     *
     * @param days number of trailing daily closes to return (>= 2)
     * @throws MarketDataException if the provider is unreachable or returns no data
     */
    List<Quote> fetchDailyHistory(String symbol, int days) throws MarketDataException;
}

package com.argosquant.market.service;

import com.argosquant.market.Quote;
import com.argosquant.market.cache.MarketDataCache;
import com.argosquant.market.client.MarketDataClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MarketDataServiceTest {

    private MarketDataClient client;
    private MarketDataCache cache;
    private ExecutorService executor;
    private MarketDataService service;

    @BeforeEach
    void setUp() {
        client = mock(MarketDataClient.class);
        cache = mock(MarketDataCache.class);
        executor = Executors.newFixedThreadPool(4);
        service = new MarketDataService(client, cache, executor);
    }

    @AfterEach
    void tearDown() {
        executor.shutdownNow();
    }

    @Test
    void cacheHitDoesNotCallProvider() {
        Quote cached = quote("TCS", "101.50");
        when(cache.get("TCS")).thenReturn(Optional.of(cached));

        Quote result = service.getQuote("tcs");

        assertEquals(cached, result);
        verify(client, never()).fetchQuote(anyString());
        verify(cache, never()).put(any());
    }

    @Test
    void cacheMissFetchesAndCaches() {
        when(cache.get("INFY")).thenReturn(Optional.empty());
        Quote fetched = quote("INFY", "200.00");
        when(client.fetchQuote("INFY")).thenReturn(fetched);

        Quote result = service.getQuote("INFY");

        assertEquals(fetched, result);
        verify(client).fetchQuote("INFY");
        verify(cache).put(fetched);
    }

    @Test
    void getQuotesReturnsAllSymbolsConcurrently() {
        when(cache.get(anyString())).thenReturn(Optional.empty());
        when(client.fetchQuote(anyString()))
                .thenAnswer(inv -> quote(inv.getArgument(0), "150.00"));

        Map<String, Quote> quotes = service.getQuotes(List.of("TCS", "INFY", "HDFC"));

        assertEquals(3, quotes.size());
        assertTrue(quotes.keySet().containsAll(List.of("TCS", "INFY", "HDFC")));
        assertEquals("TCS", quotes.get("TCS").symbol());
    }

    @Test
    void getQuotesDeduplicatesSymbols() {
        when(cache.get(anyString())).thenReturn(Optional.empty());
        when(client.fetchQuote(anyString()))
                .thenAnswer(inv -> quote(inv.getArgument(0), "150.00"));

        Map<String, Quote> quotes = service.getQuotes(List.of("TCS", "tcs", "TCS"));

        assertEquals(1, quotes.size());
        verify(client).fetchQuote("TCS");
    }

    private static Quote quote(String symbol, String price) {
        return new Quote(symbol, new BigDecimal(price), "INR", Instant.now());
    }
}

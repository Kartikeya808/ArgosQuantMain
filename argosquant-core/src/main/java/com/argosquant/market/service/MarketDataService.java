package com.argosquant.market.service;

import com.argosquant.market.Quote;
import com.argosquant.market.cache.MarketDataCache;
import com.argosquant.market.client.MarketDataClient;
import com.argosquant.market.client.MarketDataException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;

/**
 * Cache-aside market-data access. A single-symbol read tries the cache first
 * and only hits the provider on a miss. Multi-symbol reads fan out one task per
 * symbol over an {@link ExecutorService} so N symbols are fetched concurrently,
 * not sequentially (per the project's concurrency requirement).
 */
public class MarketDataService {

    private static final Logger LOG = LoggerFactory.getLogger(MarketDataService.class);

    private final MarketDataClient client;
    private final MarketDataCache cache;
    private final ExecutorService executor;

    public MarketDataService(MarketDataClient client, MarketDataCache cache, ExecutorService executor) {
        this.client = client;
        this.cache = cache;
        this.executor = executor;
    }

    /** Returns a quote for a symbol, serving a cached value when fresh and caching on miss. */
    public Quote getQuote(String symbol) {
        String ticker = normalize(symbol);
        Optional<Quote> cached = cache.get(ticker);
        if (cached.isPresent()) {
            return cached.get();
        }
        Quote quote = client.fetchQuote(ticker);
        cache.put(quote);
        return quote;
    }

    /**
     * Fetches quotes for many symbols concurrently. Symbols that fail to fetch
     * are logged and omitted rather than failing the whole batch. Iteration
     * order of the result follows the input order.
     */
    public Map<String, Quote> getQuotes(Collection<String> symbols) {
        Map<String, Future<Quote>> futures = new LinkedHashMap<>();
        for (String symbol : symbols) {
            String ticker = normalize(symbol);
            if (!futures.containsKey(ticker)) {
                futures.put(ticker, executor.submit((Callable<Quote>) () -> getQuote(ticker)));
            }
        }

        Map<String, Quote> result = new LinkedHashMap<>();
        for (Map.Entry<String, Future<Quote>> entry : futures.entrySet()) {
            try {
                result.put(entry.getKey(), entry.getValue().get());
            } catch (ExecutionException e) {
                LOG.warn("Failed to fetch quote for {}: {}", entry.getKey(), e.getCause().getMessage());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new MarketDataException("interrupted while fetching quotes", e);
            }
        }
        return result;
    }

    /**
     * Forces a fresh fetch from the provider for each symbol and updates the
     * cache, bypassing the cached value. Used by the scheduled refresh job.
     */
    public Map<String, Quote> refresh(Collection<String> symbols) {
        Map<String, Future<Quote>> futures = new LinkedHashMap<>();
        for (String symbol : symbols) {
            String ticker = normalize(symbol);
            futures.putIfAbsent(ticker, executor.submit((Callable<Quote>) () -> {
                Quote quote = client.fetchQuote(ticker);
                cache.put(quote);
                return quote;
            }));
        }

        Map<String, Quote> result = new LinkedHashMap<>();
        for (Map.Entry<String, Future<Quote>> entry : futures.entrySet()) {
            try {
                result.put(entry.getKey(), entry.getValue().get());
            } catch (ExecutionException e) {
                LOG.warn("Refresh failed for {}: {}", entry.getKey(), e.getCause().getMessage());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        return result;
    }

    private static String normalize(String symbol) {
        if (symbol == null || symbol.isBlank()) {
            throw new IllegalArgumentException("symbol is required");
        }
        return symbol.trim().toUpperCase();
    }
}

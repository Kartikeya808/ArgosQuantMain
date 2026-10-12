package com.argosquant.market.client;

import com.argosquant.market.Quote;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Deterministic stand-in for a real market-data provider (provider is TBD per
 * PRD §6). Produces a stable base price per symbol with a small time-based
 * wiggle, so the rest of the system can be built and demoed without an API key
 * or network. Swap this bean for an {@code HttpMarketDataClient} later without
 * touching any caller.
 *
 * <p>An optional artificial latency makes the value of concurrent fetching
 * (one task per symbol) observable.
 */
public class SimulatedMarketDataClient implements MarketDataClient {

    private final long latencyMillis;
    private final String currency;

    public SimulatedMarketDataClient() {
        this(0, "INR");
    }

    public SimulatedMarketDataClient(long latencyMillis, String currency) {
        this.latencyMillis = latencyMillis;
        this.currency = currency;
    }

    @Override
    public Quote fetchQuote(String symbol) throws MarketDataException {
        if (symbol == null || symbol.isBlank()) {
            throw new MarketDataException("symbol is required");
        }
        simulateLatency();
        String ticker = symbol.trim().toUpperCase();
        Instant now = Instant.now();
        BigDecimal price = priceFor(ticker, now);
        return new Quote(ticker, price, currency, now);
    }

    @Override
    public List<Quote> fetchDailyHistory(String symbol, int days) throws MarketDataException {
        if (symbol == null || symbol.isBlank()) {
            throw new MarketDataException("symbol is required");
        }
        if (days < 2) {
            throw new MarketDataException("days must be >= 2");
        }
        simulateLatency();
        String ticker = symbol.trim().toUpperCase();

        // Deterministic random walk seeded by the symbol, so the series is
        // stable across calls within a run (good for demos and assertions).
        Random rng = new Random(ticker.hashCode());
        double price = 100 + Math.floorMod(ticker.hashCode(), 900);
        double dailyDrift = 0.0003;   // ~7.8%/yr
        double dailyVol = 0.012;      // ~19%/yr annualized

        Instant startDay = Instant.now().minus(days - 1L, ChronoUnit.DAYS);
        List<Quote> history = new ArrayList<>(days);
        for (int i = 0; i < days; i++) {
            if (i > 0) {
                price *= 1.0 + dailyDrift + dailyVol * rng.nextGaussian();
                price = Math.max(price, 0.01);
            }
            BigDecimal close = BigDecimal.valueOf(price).setScale(2, RoundingMode.HALF_UP);
            history.add(new Quote(ticker, close, currency, startDay.plus(i, ChronoUnit.DAYS)));
        }
        return history;
    }

    /** Stable base in [100, 1000) from the symbol, plus a ±2% wiggle that changes each minute. */
    private BigDecimal priceFor(String ticker, Instant now) {
        int base = 100 + Math.floorMod(ticker.hashCode(), 900);
        long minute = now.getEpochSecond() / 60;
        double wigglePct = ((Math.floorMod(ticker.hashCode() * 31L + minute, 400)) - 200) / 100.0; // -2.00 .. +1.99
        double price = base * (1.0 + wigglePct / 100.0);
        return BigDecimal.valueOf(price).setScale(2, RoundingMode.HALF_UP);
    }

    private void simulateLatency() {
        if (latencyMillis <= 0) {
            return;
        }
        try {
            Thread.sleep(latencyMillis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new MarketDataException("interrupted while fetching quote", e);
        }
    }
}

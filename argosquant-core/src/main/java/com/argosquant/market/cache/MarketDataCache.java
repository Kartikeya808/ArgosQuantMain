package com.argosquant.market.cache;

import com.argosquant.market.Quote;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.exceptions.JedisException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

/**
 * Redis-backed quote cache with a freshness TTL. Degrades gracefully: if Redis
 * is null or unreachable, reads return empty and writes are no-ops, so market
 * data still flows (straight from the provider) and core features are never
 * blocked by a cache outage.
 *
 * <p>Quotes are stored under {@code quote:<SYMBOL>} as {@code price|currency|epochMillis}
 * with a Redis TTL equal to {@code ttlSeconds}, so stale entries expire on their own.
 */
public class MarketDataCache {

    private static final Logger LOG = LoggerFactory.getLogger(MarketDataCache.class);
    private static final String KEY_PREFIX = "quote:";

    private final JedisPool pool;
    private final long ttlSeconds;

    public MarketDataCache(JedisPool pool, long ttlSeconds) {
        this.pool = pool;
        this.ttlSeconds = ttlSeconds;
    }

    public long ttlSeconds() {
        return ttlSeconds;
    }

    public Optional<Quote> get(String symbol) {
        if (pool == null) {
            return Optional.empty();
        }
        String key = KEY_PREFIX + symbol.toUpperCase();
        try (Jedis jedis = pool.getResource()) {
            String raw = jedis.get(key);
            return raw == null ? Optional.empty() : deserialize(symbol, raw);
        } catch (JedisException e) {
            LOG.warn("Redis unavailable on get({}); treating as cache miss: {}", symbol, e.getMessage());
            return Optional.empty();
        }
    }

    public void put(Quote quote) {
        if (pool == null) {
            return;
        }
        String key = KEY_PREFIX + quote.symbol().toUpperCase();
        try (Jedis jedis = pool.getResource()) {
            jedis.setex(key, ttlSeconds, serialize(quote));
        } catch (JedisException e) {
            LOG.warn("Redis unavailable on put({}); quote not cached: {}", quote.symbol(), e.getMessage());
        }
    }

    private static String serialize(Quote q) {
        return q.price().toPlainString() + "|" + q.currency() + "|" + q.asOf().toEpochMilli();
    }

    private static Optional<Quote> deserialize(String symbol, String raw) {
        String[] parts = raw.split("\\|", 3);
        if (parts.length != 3) {
            return Optional.empty();
        }
        try {
            BigDecimal price = new BigDecimal(parts[0]);
            String currency = parts[1];
            Instant asOf = Instant.ofEpochMilli(Long.parseLong(parts[2]));
            return Optional.of(new Quote(symbol.toUpperCase(), price, currency, asOf));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }
}

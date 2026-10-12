package com.argosquant.web.config;

import com.argosquant.database.Jdbc;
import com.argosquant.market.cache.MarketDataCache;
import com.argosquant.market.client.MarketDataClient;
import com.argosquant.market.client.SimulatedMarketDataClient;
import com.argosquant.market.client.YahooMarketDataClient;
import com.argosquant.market.service.MarketDataService;
import com.argosquant.market.watchlist.WatchlistRepository;
import com.argosquant.market.watchlist.WatchlistService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import redis.clients.jedis.JedisPool;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Wires the market-data stack: Redis cache, provider client, the fetch
 * thread pool, and the services. The {@link MarketDataClient} is the simulated
 * implementation for now (provider TBD); swapping it here is the only change
 * needed to go live.
 */
@Configuration
public class MarketConfig {

    @Bean(destroyMethod = "close")
    public JedisPool jedisPool(@Value("${argos.redis.host:localhost}") String host,
                               @Value("${argos.redis.port:6379}") int port) {
        return new JedisPool(host, port);
    }

    @Bean
    public MarketDataCache marketDataCache(JedisPool pool,
                                           @Value("${argos.market.cache-ttl-seconds:60}") long ttlSeconds) {
        return new MarketDataCache(pool, ttlSeconds);
    }

    /**
     * The live data source. Defaults to the Yahoo Finance client (real quotes,
     * no API key); set {@code argos.market.provider=simulated} to fall back to
     * the deterministic stand-in for offline/no-network demos.
     */
    @Bean
    public MarketDataClient marketDataClient(
            @Value("${argos.market.provider:yahoo}") String provider,
            @Value("${argos.market.simulated-latency-ms:40}") long latencyMs,
            @Value("${argos.market.currency:INR}") String currency,
            @Value("${argos.market.yahoo.symbol-suffix:.NS}") String symbolSuffix,
            @Value("${argos.market.yahoo.timeout-ms:8000}") long timeoutMs) {
        if ("simulated".equalsIgnoreCase(provider)) {
            return new SimulatedMarketDataClient(latencyMs, currency);
        }
        return new YahooMarketDataClient(java.time.Duration.ofMillis(timeoutMs), symbolSuffix, currency);
    }

    /** Dedicated pool for per-symbol fetches; shut down cleanly on context close. */
    @Bean(destroyMethod = "shutdown")
    public ExecutorService marketDataExecutor(@Value("${argos.market.fetch-threads:8}") int threads) {
        return Executors.newFixedThreadPool(threads, r -> {
            Thread t = new Thread(r, "market-fetch");
            t.setDaemon(true);
            return t;
        });
    }

    @Bean
    public MarketDataService marketDataService(MarketDataClient client, MarketDataCache cache,
                                               ExecutorService marketDataExecutor) {
        return new MarketDataService(client, cache, marketDataExecutor);
    }

    @Bean
    public WatchlistRepository watchlistRepository() {
        return new WatchlistRepository();
    }

    @Bean
    public WatchlistService watchlistService(Jdbc jdbc, WatchlistRepository repository) {
        return new WatchlistService(jdbc, repository);
    }
}

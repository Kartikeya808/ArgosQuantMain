package com.argosquant.market.client;

import com.argosquant.market.Quote;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Live {@link MarketDataClient} backed by Yahoo Finance's public chart API
 * ({@code query1.finance.yahoo.com/v8/finance/chart/{symbol}}). No API key is
 * required. A single endpoint serves both the latest spot price (from
 * {@code meta.regularMarketPrice}) and a daily close history (from
 * {@code timestamp[]} + {@code indicators.quote[0].close[]}).
 *
 * <p>Symbols are mapped to Yahoo's exchange-suffixed form: a plain ticker like
 * {@code TCS} becomes {@code TCS.NS} (NSE) via {@code symbolSuffix}; a ticker
 * that already carries a dotted suffix (e.g. {@code AAPL} on a US feed, or an
 * explicit {@code INFY.NS}) is passed through unchanged. Currency is taken from
 * the provider response ({@code meta.currency}), falling back to
 * {@code defaultCurrency}.
 *
 * <p>This is an unofficial endpoint, so it can rate-limit or change shape; any
 * network error, non-2xx status, or missing field is surfaced as a
 * {@link MarketDataException} so callers degrade gracefully (the cache and the
 * rest of the app keep working off the last good value).
 */
public class YahooMarketDataClient implements MarketDataClient {

    private static final String BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart/";
    // Yahoo rejects requests without a browser-like UA with 403/429.
    private static final String USER_AGENT = "Mozilla/5.0 (ArgosQuant market-data client)";

    /**
     * Known index/benchmark tickers that don't follow the plain-ticker + suffix
     * convention. Yahoo exposes indices under caret symbols (e.g. the Nifty 50
     * is {@code ^NSEI}, the Sensex is {@code ^BSESN}), so the benchmark symbol
     * the analytics layer uses ({@code NIFTY50}) must be translated here.
     */
    private static final Map<String, String> SYMBOL_ALIASES = Map.of(
            "NIFTY50", "^NSEI",
            "NIFTY", "^NSEI",
            "SENSEX", "^BSESN");

    private final HttpClient http;
    private final ObjectMapper json = new ObjectMapper();
    private final Duration requestTimeout;
    private final String symbolSuffix;
    private final String defaultCurrency;

    public YahooMarketDataClient() {
        this(Duration.ofSeconds(8), ".NS", "INR");
    }

    /**
     * @param requestTimeout  per-request timeout
     * @param symbolSuffix    exchange suffix appended to bare tickers (e.g. {@code ".NS"} for NSE)
     * @param defaultCurrency currency used if the provider omits one
     */
    public YahooMarketDataClient(Duration requestTimeout, String symbolSuffix, String defaultCurrency) {
        this.http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.requestTimeout = requestTimeout;
        this.symbolSuffix = symbolSuffix == null ? "" : symbolSuffix;
        this.defaultCurrency = defaultCurrency;
    }

    @Override
    public Quote fetchQuote(String symbol) throws MarketDataException {
        String ticker = displayTicker(symbol);
        JsonNode meta = chartResult(yahooSymbol(ticker), "range=1d&interval=1d").path("meta");

        JsonNode priceNode = meta.path("regularMarketPrice");
        if (priceNode.isMissingNode() || priceNode.isNull()) {
            throw new MarketDataException("no price in Yahoo response for " + ticker);
        }
        BigDecimal price = new BigDecimal(priceNode.asText());
        String currency = meta.path("currency").asText(defaultCurrency);
        long epochSeconds = meta.path("regularMarketTime").asLong(0);
        Instant asOf = epochSeconds > 0 ? Instant.ofEpochSecond(epochSeconds) : Instant.now();

        return new Quote(ticker, price, currency, asOf);
    }

    @Override
    public List<Quote> fetchDailyHistory(String symbol, int days) throws MarketDataException {
        if (days < 2) {
            throw new MarketDataException("days must be >= 2");
        }
        String ticker = displayTicker(symbol);

        // Request a calendar window generously wider than `days` trading days so
        // weekends/holidays don't starve us of closes, then keep the last `days`.
        Instant now = Instant.now();
        long lookbackDays = (long) days * 2L + 10L;
        long period2 = now.getEpochSecond();
        long period1 = now.minus(Duration.ofDays(lookbackDays)).getEpochSecond();

        JsonNode result = chartResult(yahooSymbol(ticker),
                "period1=" + period1 + "&period2=" + period2 + "&interval=1d");

        JsonNode timestamps = result.path("timestamp");
        JsonNode closes = result.path("indicators").path("quote").path(0).path("close");
        String currency = result.path("meta").path("currency").asText(defaultCurrency);

        if (!timestamps.isArray() || !closes.isArray() || timestamps.size() == 0) {
            throw new MarketDataException("no daily history in Yahoo response for " + ticker);
        }

        // Yahoo returns ascending (oldest-first); keep nulls (market holidays
        // mid-series) out so the analytics layer gets a clean close series.
        List<Quote> series = new ArrayList<>(timestamps.size());
        for (int i = 0; i < timestamps.size(); i++) {
            JsonNode close = closes.path(i);
            if (close.isMissingNode() || close.isNull()) {
                continue;
            }
            Instant asOf = Instant.ofEpochSecond(timestamps.path(i).asLong());
            series.add(new Quote(ticker, new BigDecimal(close.asText()), currency, asOf));
        }

        if (series.size() < 2) {
            throw new MarketDataException("insufficient daily history for " + ticker
                    + " (got " + series.size() + " closes)");
        }
        // Trim to the most recent `days` closes, preserving ascending order.
        if (series.size() > days) {
            series = new ArrayList<>(series.subList(series.size() - days, series.size()));
        }
        return series;
    }

    /** The caller-facing ticker, normalized to uppercase; this is what quotes carry. */
    private String displayTicker(String symbol) {
        if (symbol == null || symbol.isBlank()) {
            throw new MarketDataException("symbol is required");
        }
        return symbol.trim().toUpperCase();
    }

    /** Maps a display ticker to the Yahoo symbol used in the URL. */
    private String yahooSymbol(String ticker) {
        String alias = SYMBOL_ALIASES.get(ticker);
        if (alias != null) {
            return alias;
        }
        // Indices (^NSEI) and already-qualified tickers (INFY.NS) pass through;
        // a bare ticker gets the exchange suffix (TCS -> TCS.NS).
        if (ticker.startsWith("^") || ticker.contains(".")) {
            return ticker;
        }
        return ticker + symbolSuffix;
    }

    /** Fetches {@code chart.result[0]}, validating transport and provider-level errors. */
    private JsonNode chartResult(String yahooSymbol, String query) throws MarketDataException {
        // Index tickers carry a '^' which is illegal in a raw URI path, so encode.
        String encoded = java.net.URLEncoder.encode(yahooSymbol, java.nio.charset.StandardCharsets.UTF_8);
        URI uri = URI.create(BASE_URL + encoded + "?" + query);
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(requestTimeout)
                .header("User-Agent", USER_AGENT)
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response;
        try {
            response = http.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (java.io.IOException e) {
            throw new MarketDataException("Yahoo request failed for " + yahooSymbol, e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new MarketDataException("Yahoo request interrupted for " + yahooSymbol, e);
        }

        if (response.statusCode() / 100 != 2) {
            throw new MarketDataException("Yahoo HTTP " + response.statusCode()
                    + " for " + yahooSymbol);
        }

        JsonNode root;
        try {
            root = json.readTree(response.body());
        } catch (java.io.IOException e) {
            throw new MarketDataException("malformed Yahoo response for " + yahooSymbol, e);
        }

        JsonNode chart = root.path("chart");
        JsonNode error = chart.path("error");
        if (!error.isNull() && !error.isMissingNode()) {
            throw new MarketDataException("Yahoo error for " + yahooSymbol + ": "
                    + error.path("description").asText(error.toString()));
        }
        JsonNode result = chart.path("result").path(0);
        if (result.isMissingNode() || result.isNull()) {
            throw new MarketDataException("no result in Yahoo response for " + yahooSymbol);
        }
        return result;
    }
}

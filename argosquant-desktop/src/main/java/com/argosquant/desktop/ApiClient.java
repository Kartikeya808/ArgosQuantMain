package com.argosquant.desktop;

import com.argosquant.dashboard.PortfolioDashboard;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Thin, blocking HTTP client for the ArgosQuant REST backend — the same API the
 * React web client uses. Holds the bearer JWT in memory after login. All calls
 * are synchronous and throw {@link ApiException}; callers run them off the FX
 * application thread.
 *
 * <p>The dashboard is deserialized straight into the shared core record
 * {@link PortfolioDashboard} (the desktop module depends on argosquant-core for
 * exactly these DTOs). Responses that carry {@code java.time} fields
 * (portfolios, quotes) are read via {@link JsonNode} so we don't need the
 * Jackson JSR-310 module on the classpath.
 */
public final class ApiClient {

    /** A portfolio as shown in the picker. */
    public record PortfolioRef(long id, String name, String baseCurrency) {
        @Override
        public String toString() {
            return name + "  ·  " + baseCurrency;
        }
    }

    /** A single market quote (price/asOf kept as raw strings; formatted in the UI). */
    public record QuoteView(String symbol, String price, String currency, String asOf) {
    }

    private final String baseUrl;
    private final HttpClient http;
    private final ObjectMapper json;
    private String token;

    public ApiClient(String baseUrl) {
        this.baseUrl = baseUrl;
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        this.json = new ObjectMapper()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public boolean isAuthenticated() {
        return token != null;
    }

    public void clearToken() {
        token = null;
    }

    /* ------------------------------- auth -------------------------------- */

    /** Health probe for the login-screen banner. Public endpoint — no token needed. */
    public String health() throws ApiException {
        JsonNode n = parse(send("GET", "/health", null));
        return n.path("status").asText("?") + " · database " + n.path("database").asText("?");
    }

    public void login(String email, String password) throws ApiException {
        JsonNode n = parse(send("POST", "/auth/login",
                body(Map.of("email", email, "password", password))));
        captureToken(n);
    }

    public void register(String email, String displayName, String password) throws ApiException {
        JsonNode n = parse(send("POST", "/auth/register",
                body(Map.of("email", email, "displayName", displayName, "password", password))));
        captureToken(n);
    }

    private void captureToken(JsonNode authResponse) throws ApiException {
        String t = authResponse.path("token").asText(null);
        if (t == null || t.isBlank()) {
            throw new ApiException("No token in auth response");
        }
        this.token = t;
    }

    /* -------------------------- portfolios/dash -------------------------- */

    public List<PortfolioRef> portfolios() throws ApiException {
        JsonNode arr = parse(send("GET", "/portfolios", null));
        List<PortfolioRef> out = new ArrayList<>();
        if (arr.isArray()) {
            for (JsonNode p : arr) {
                out.add(new PortfolioRef(
                        p.path("id").asLong(),
                        p.path("name").asText(""),
                        p.path("baseCurrency").asText("INR")));
            }
        }
        return out;
    }

    public PortfolioDashboard dashboard(long portfolioId) throws ApiException {
        String raw = send("GET", "/portfolios/" + portfolioId + "/dashboard", null);
        try {
            return json.readValue(raw, PortfolioDashboard.class);
        } catch (Exception e) {
            throw new ApiException("Could not parse dashboard response", e);
        }
    }

    /* ------------------------------ market ------------------------------- */

    public QuoteView quote(String symbol) throws ApiException {
        JsonNode n = parse(send("GET", "/market/quote/" + enc(symbol), null));
        return toQuote(n);
    }

    /* ----------------------------- watchlist ----------------------------- */

    public List<QuoteView> watchlistQuotes() throws ApiException {
        JsonNode n = parse(send("GET", "/watchlist/quotes", null));
        List<QuoteView> out = new ArrayList<>();
        n.fields().forEachRemaining(e -> out.add(toQuote(e.getValue())));
        out.sort((a, b) -> a.symbol().compareToIgnoreCase(b.symbol()));
        return out;
    }

    public void addToWatchlist(String symbol) throws ApiException {
        send("POST", "/watchlist", body(Map.of("symbol", symbol)));
    }

    public void removeFromWatchlist(String symbol) throws ApiException {
        send("DELETE", "/watchlist/" + enc(symbol), null);
    }

    /* ---------------------------- HTTP plumbing -------------------------- */

    private QuoteView toQuote(JsonNode n) {
        return new QuoteView(
                n.path("symbol").asText(""),
                n.path("price").asText("—"),
                n.path("currency").asText(""),
                n.path("asOf").asText(""));
    }

    private String send(String method, String path, String jsonBody) throws ApiException {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(baseUrl + path))
                .timeout(Duration.ofSeconds(12));
        if (jsonBody != null) {
            b.header("Content-Type", "application/json");
        }
        if (token != null) {
            b.header("Authorization", "Bearer " + token);
        }
        b.method(method, jsonBody == null
                ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(jsonBody));

        HttpResponse<String> res;
        try {
            res = http.send(b.build(), HttpResponse.BodyHandlers.ofString());
        } catch (java.io.IOException e) {
            throw new ApiException("Cannot reach the backend on " + baseUrl + " — is it running?", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException("Request interrupted", e);
        }

        if (res.statusCode() / 100 != 2) {
            throw new ApiException(extractMessage(res.body(), res.statusCode()));
        }
        return res.body();
    }

    /** Pulls a human message out of the backend's error JSON, else a status line. */
    private String extractMessage(String responseBody, int status) {
        try {
            JsonNode n = json.readTree(responseBody);
            for (String field : new String[] {"message", "error", "detail"}) {
                String v = n.path(field).asText(null);
                if (v != null && !v.isBlank()) {
                    return v;
                }
            }
        } catch (Exception ignored) {
            // fall through to the status line
        }
        return "Request failed (HTTP " + status + ")";
    }

    private String body(Map<String, String> fields) throws ApiException {
        try {
            return json.writeValueAsString(fields);
        } catch (Exception e) {
            throw new ApiException("Could not build request body", e);
        }
    }

    private JsonNode parse(String responseBody) throws ApiException {
        try {
            return json.readTree(responseBody);
        } catch (Exception e) {
            throw new ApiException("Malformed response from backend", e);
        }
    }

    private static String enc(String s) {
        return URLEncoder.encode(s.trim().toUpperCase(), StandardCharsets.UTF_8);
    }
}

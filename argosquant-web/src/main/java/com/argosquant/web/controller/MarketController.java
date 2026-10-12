package com.argosquant.web.controller;

import com.argosquant.market.Quote;
import com.argosquant.market.service.MarketDataService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/** Read-only market quote access. Requires authentication (configured in SecurityConfig). */
@RestController
@RequestMapping("/api/market")
public class MarketController {

    private final MarketDataService marketDataService;

    public MarketController(MarketDataService marketDataService) {
        this.marketDataService = marketDataService;
    }

    @GetMapping("/quote/{symbol}")
    public Quote quote(@PathVariable String symbol) {
        return marketDataService.getQuote(symbol);
    }

    /** Batch quotes, fetched concurrently. Example: {@code /api/market/quotes?symbols=TCS,INFY,HDFC}. */
    @GetMapping("/quotes")
    public Map<String, Quote> quotes(@RequestParam String symbols) {
        List<String> list = Arrays.stream(symbols.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        return marketDataService.getQuotes(list);
    }
}

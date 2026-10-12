package com.argosquant.web.controller;

import com.argosquant.market.Quote;
import com.argosquant.market.service.MarketDataService;
import com.argosquant.market.watchlist.WatchlistService;
import com.argosquant.web.dto.WatchlistRequest;
import com.argosquant.web.security.CurrentUser;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Per-user watchlist management plus a concurrent quote snapshot of the list. */
@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {

    private final WatchlistService watchlistService;
    private final MarketDataService marketDataService;

    public WatchlistController(WatchlistService watchlistService, MarketDataService marketDataService) {
        this.watchlistService = watchlistService;
        this.marketDataService = marketDataService;
    }

    @GetMapping
    public List<String> list() {
        return watchlistService.list(CurrentUser.userId());
    }

    @PostMapping
    public List<String> add(@RequestBody WatchlistRequest request) {
        return watchlistService.add(CurrentUser.userId(), request.symbol());
    }

    @DeleteMapping("/{symbol}")
    public List<String> remove(@PathVariable String symbol) {
        return watchlistService.remove(CurrentUser.userId(), symbol);
    }

    /** Current quotes for every symbol on the user's watchlist, fetched concurrently. */
    @GetMapping("/quotes")
    public Map<String, Quote> quotes() {
        List<String> symbols = watchlistService.list(CurrentUser.userId());
        return marketDataService.getQuotes(symbols);
    }
}

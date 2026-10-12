package com.argosquant.web.job;

import com.argosquant.market.service.MarketDataService;
import com.argosquant.market.watchlist.WatchlistService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Periodically warms the quote cache for every watched symbol. Runs on Spring's
 * scheduler thread — off any request thread — and fetches symbols concurrently
 * via {@link MarketDataService#refresh}. Failures for individual symbols are
 * swallowed inside the service so one bad symbol never stops the batch.
 */
@Component
public class MarketDataRefreshJob {

    private static final Logger LOG = LoggerFactory.getLogger(MarketDataRefreshJob.class);

    private final WatchlistService watchlistService;
    private final MarketDataService marketDataService;

    public MarketDataRefreshJob(WatchlistService watchlistService, MarketDataService marketDataService) {
        this.watchlistService = watchlistService;
        this.marketDataService = marketDataService;
    }

    @Scheduled(
            initialDelayString = "${argos.market.refresh-initial-delay-ms:15000}",
            fixedDelayString = "${argos.market.refresh-interval-ms:60000}")
    public void refreshWatchedSymbols() {
        List<String> symbols = watchlistService.allWatchedSymbols();
        if (symbols.isEmpty()) {
            return;
        }
        int refreshed = marketDataService.refresh(symbols).size();
        LOG.info("Scheduled refresh updated {}/{} watched symbol(s).", refreshed, symbols.size());
    }
}

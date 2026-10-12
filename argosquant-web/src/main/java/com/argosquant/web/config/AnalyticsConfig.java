package com.argosquant.web.config;

import com.argosquant.analytics.beta.BetaCalculator;
import com.argosquant.analytics.drawdown.DrawdownCalculator;
import com.argosquant.analytics.returns.ReturnsCalculator;
import com.argosquant.analytics.sharpe.SharpeRatioCalculator;
import com.argosquant.analytics.var.ValueAtRiskCalculator;
import com.argosquant.analytics.volatility.VolatilityCalculator;
import com.argosquant.database.Jdbc;
import com.argosquant.market.client.MarketDataClient;
import com.argosquant.portfolio.repository.HoldingRepository;
import com.argosquant.portfolio.repository.StockRepository;
import com.argosquant.portfolio.service.PortfolioService;
import com.argosquant.risk.CorrelationService;
import com.argosquant.risk.PortfolioAnalyticsService;
import com.argosquant.risk.RiskEngine;
import com.argosquant.risk.RiskScoreService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ExecutorService;

/** Wires the analytics calculators and risk services (all plain-Java, from core). */
@Configuration
public class AnalyticsConfig {

    @Bean
    public ReturnsCalculator returnsCalculator() {
        return new ReturnsCalculator();
    }

    @Bean
    public VolatilityCalculator volatilityCalculator() {
        return new VolatilityCalculator();
    }

    @Bean
    public SharpeRatioCalculator sharpeRatioCalculator() {
        return new SharpeRatioCalculator();
    }

    @Bean
    public BetaCalculator betaCalculator() {
        return new BetaCalculator();
    }

    @Bean
    public ValueAtRiskCalculator valueAtRiskCalculator() {
        return new ValueAtRiskCalculator();
    }

    @Bean
    public DrawdownCalculator drawdownCalculator() {
        return new DrawdownCalculator();
    }

    @Bean
    public CorrelationService correlationService() {
        return new CorrelationService();
    }

    @Bean
    public RiskScoreService riskScoreService() {
        return new RiskScoreService();
    }

    @Bean
    public RiskEngine riskEngine(ReturnsCalculator returns, VolatilityCalculator volatility,
                                 SharpeRatioCalculator sharpe, ValueAtRiskCalculator var,
                                 DrawdownCalculator drawdown, BetaCalculator beta) {
        return new RiskEngine(returns, volatility, sharpe, var, drawdown, beta);
    }

    @Bean
    public PortfolioAnalyticsService portfolioAnalyticsService(
            Jdbc jdbc, PortfolioService portfolioService, HoldingRepository holdings, StockRepository stocks,
            MarketDataClient marketDataClient, RiskEngine riskEngine, RiskScoreService riskScoreService,
            CorrelationService correlationService, ReturnsCalculator returns, VolatilityCalculator volatility,
            BetaCalculator beta, ExecutorService marketDataExecutor,
            @Value("${argos.analytics.history-days:252}") int historyDays,
            @Value("${argos.analytics.risk-free:0.065}") double riskFree,
            @Value("${argos.analytics.benchmark:NIFTY50}") String benchmark) {
        return new PortfolioAnalyticsService(jdbc, portfolioService, holdings, stocks, marketDataClient,
                riskEngine, riskScoreService, correlationService, returns, volatility, beta, marketDataExecutor,
                historyDays, riskFree, benchmark);
    }
}

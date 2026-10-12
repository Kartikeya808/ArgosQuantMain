package com.argosquant.web.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Enables Spring's scheduled task execution (used by {@code MarketDataRefreshJob}). */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}

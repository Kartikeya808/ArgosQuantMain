package com.argosquant.web.dto;

/** Request body for creating a portfolio. {@code baseCurrency} may be null (defaults to INR). */
public record CreatePortfolioRequest(String name, String baseCurrency) {
}

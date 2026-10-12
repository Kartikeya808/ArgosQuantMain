package com.argosquant.risk;

/**
 * A 0–100 composite risk score (higher = riskier) with its qualitative band
 * and a short human-readable rationale.
 */
public record RiskScore(int score, RiskRating rating, String rationale) {
}

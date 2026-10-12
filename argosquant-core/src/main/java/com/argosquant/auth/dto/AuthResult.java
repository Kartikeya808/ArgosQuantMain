package com.argosquant.auth.dto;

/** Successful auth outcome: a signed JWT plus the identity it represents. */
public record AuthResult(
        String token,
        long expiresInSeconds,
        long userId,
        String email,
        String displayName) {
}

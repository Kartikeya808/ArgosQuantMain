package com.argosquant.auth.security;

/** The authenticated identity carried in a validated JWT. */
public record AuthPrincipal(long userId, String email) {
}

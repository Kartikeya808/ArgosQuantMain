package com.argosquant.web.security;

import com.argosquant.auth.security.AuthPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Convenience accessor for the authenticated principal in controller methods. */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static AuthPrincipal require() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthPrincipal principal)) {
            throw new IllegalStateException("No authenticated user on the security context");
        }
        return principal;
    }

    public static long userId() {
        return require().userId();
    }
}

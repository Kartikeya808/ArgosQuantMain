package com.argosquant.model;

import java.time.Instant;

/** A named collection of holdings owned by a {@link User}. */
public record Portfolio(
        Long id,
        Long userId,
        String name,
        String baseCurrency,
        Instant createdAt) {
}

package com.argosquant.model;

import java.time.Instant;

/** A registered account. {@code passwordHash} is a BCrypt hash, never a plaintext password. */
public record User(
        Long id,
        String email,
        String displayName,
        String passwordHash,
        Instant createdAt) {
}

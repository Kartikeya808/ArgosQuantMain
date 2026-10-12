package com.argosquant.auth.security;

import org.mindrot.jbcrypt.BCrypt;

/** BCrypt password hashing. Plaintext passwords are never stored or logged. */
public class PasswordHasher {

    private final int logRounds;

    public PasswordHasher() {
        this(12);
    }

    public PasswordHasher(int logRounds) {
        this.logRounds = logRounds;
    }

    public String hash(String rawPassword) {
        return BCrypt.hashpw(rawPassword, BCrypt.gensalt(logRounds));
    }

    public boolean matches(String rawPassword, String storedHash) {
        if (storedHash == null || storedHash.isBlank()) {
            return false;
        }
        return BCrypt.checkpw(rawPassword, storedHash);
    }
}

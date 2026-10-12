package com.argosquant.auth.service;

import com.argosquant.auth.dto.AuthResult;
import com.argosquant.auth.dto.LoginCommand;
import com.argosquant.auth.dto.RegistrationCommand;
import com.argosquant.auth.repository.UserRepository;
import com.argosquant.auth.security.JwtService;
import com.argosquant.auth.security.PasswordHasher;
import com.argosquant.database.Jdbc;
import com.argosquant.exceptions.AuthenticationFailedException;
import com.argosquant.exceptions.EmailAlreadyExistsException;
import com.argosquant.model.User;

import java.util.Optional;

/**
 * Registration and login. Hashes passwords with BCrypt and issues JWTs; holds
 * no framework dependencies so the same logic serves web and desktop clients.
 */
public class AuthService {

    private static final int MIN_PASSWORD_LENGTH = 8;

    private final Jdbc jdbc;
    private final UserRepository users;
    private final PasswordHasher passwordHasher;
    private final JwtService jwtService;

    public AuthService(Jdbc jdbc, UserRepository users, PasswordHasher passwordHasher, JwtService jwtService) {
        this.jdbc = jdbc;
        this.users = users;
        this.passwordHasher = passwordHasher;
        this.jwtService = jwtService;
    }

    public AuthResult register(RegistrationCommand command) throws EmailAlreadyExistsException {
        String email = normalizeEmail(command.email());
        String displayName = require(command.displayName(), "displayName");
        String password = command.password();
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalArgumentException("password must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }

        String hash = passwordHasher.hash(password);
        try {
            User created = jdbc.inTransaction(conn -> {
                if (users.existsByEmail(conn, email)) {
                    throw new EmailExistsSignal(email);
                }
                return users.insert(conn, email, displayName, hash);
            });
            return issueFor(created);
        } catch (EmailExistsSignal signal) {
            throw new EmailAlreadyExistsException(signal.email);
        }
    }

    public AuthResult login(LoginCommand command) throws AuthenticationFailedException {
        String email = normalizeEmail(command.email());
        Optional<User> found = jdbc.inConnection(conn -> users.findByEmail(conn, email));
        User user = found.orElseThrow(AuthenticationFailedException::new);
        if (!passwordHasher.matches(command.password(), user.passwordHash())) {
            throw new AuthenticationFailedException();
        }
        return issueFor(user);
    }

    private AuthResult issueFor(User user) {
        String token = jwtService.issue(user.id(), user.email());
        return new AuthResult(token, jwtService.ttlSeconds(), user.id(), user.email(), user.displayName());
    }

    private static String normalizeEmail(String email) {
        String value = require(email, "email").toLowerCase();
        if (!value.contains("@")) {
            throw new IllegalArgumentException("email is not valid");
        }
        return value;
    }

    private static String require(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
        return value.trim();
    }

    /**
     * Unchecked signal used to abort a transaction when the email is taken; the
     * {@link Jdbc} helper only lets {@link RuntimeException}s propagate out of a
     * transaction, so this is unwrapped to the checked
     * {@link EmailAlreadyExistsException} at the boundary.
     */
    private static final class EmailExistsSignal extends RuntimeException {
        private final String email;

        EmailExistsSignal(String email) {
            this.email = email;
        }
    }
}

package com.argosquant.exceptions;

/**
 * Base checked exception for recoverable, user-facing business rule violations.
 *
 * <p>Checked (extends {@link Exception}) by design: callers must acknowledge
 * these outcomes, and the web layer translates each subclass to an HTTP status.
 */
public abstract class ArgosException extends Exception {

    protected ArgosException(String message) {
        super(message);
    }

    protected ArgosException(String message, Throwable cause) {
        super(message, cause);
    }
}

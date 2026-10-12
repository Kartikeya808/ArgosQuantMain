package com.argosquant.exceptions;

/**
 * Unchecked carrier that tunnels a checked {@link ArgosException} out of a
 * context that only permits runtime exceptions (e.g. a JDBC transaction
 * lambda). Services catch it at the boundary and rethrow {@link #unwrap()}.
 */
public final class UncheckedArgosException extends RuntimeException {

    public UncheckedArgosException(ArgosException cause) {
        super(cause);
    }

    /** @return the wrapped checked exception, for rethrowing from a method that declares {@code throws ArgosException}. */
    public ArgosException unwrap() {
        return (ArgosException) getCause();
    }
}

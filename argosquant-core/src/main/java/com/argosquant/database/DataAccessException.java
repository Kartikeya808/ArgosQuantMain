package com.argosquant.database;

import java.sql.SQLException;

/**
 * Unchecked wrapper for {@link SQLException}. Infrastructure failures (DB down,
 * constraint violation, driver error) are not recoverable business outcomes, so
 * they propagate as runtime exceptions rather than polluting service signatures;
 * recoverable rule violations use the checked
 * {@link com.argosquant.exceptions.ArgosException} hierarchy instead.
 */
public class DataAccessException extends RuntimeException {

    public DataAccessException(String message, Throwable cause) {
        super(message, cause);
    }

    public DataAccessException(Throwable cause) {
        super(cause);
    }
}

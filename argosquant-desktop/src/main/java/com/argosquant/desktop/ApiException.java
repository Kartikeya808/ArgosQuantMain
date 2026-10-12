package com.argosquant.desktop;

/** A failure talking to the REST backend (transport error or non-2xx response). */
public class ApiException extends Exception {

    public ApiException(String message) {
        super(message);
    }

    public ApiException(String message, Throwable cause) {
        super(message, cause);
    }
}

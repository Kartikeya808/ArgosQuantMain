package com.argosquant.exceptions;

/** Thrown when creating a resource that conflicts with an existing one (e.g. duplicate portfolio name). */
public class DuplicateResourceException extends ArgosException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}

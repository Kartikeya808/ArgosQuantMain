package com.argosquant.exceptions;

/** Thrown when registering with an email that is already taken. */
public class EmailAlreadyExistsException extends ArgosException {

    public EmailAlreadyExistsException(String email) {
        super("An account already exists for " + email);
    }
}

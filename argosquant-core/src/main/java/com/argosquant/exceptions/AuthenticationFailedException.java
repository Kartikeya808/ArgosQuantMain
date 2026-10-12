package com.argosquant.exceptions;

/** Thrown when login credentials do not match any account. Message is deliberately generic. */
public class AuthenticationFailedException extends ArgosException {

    public AuthenticationFailedException() {
        super("Invalid email or password");
    }
}

package com.argosquant.auth.dto;

/** Input to register a new account. */
public record RegistrationCommand(String email, String displayName, String password) {
}

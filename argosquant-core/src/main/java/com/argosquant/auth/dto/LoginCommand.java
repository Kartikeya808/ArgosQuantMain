package com.argosquant.auth.dto;

/** Input to authenticate an existing account. */
public record LoginCommand(String email, String password) {
}

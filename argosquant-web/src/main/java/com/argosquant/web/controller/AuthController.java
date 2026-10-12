package com.argosquant.web.controller;

import com.argosquant.auth.dto.AuthResult;
import com.argosquant.auth.dto.LoginCommand;
import com.argosquant.auth.dto.RegistrationCommand;
import com.argosquant.auth.service.AuthService;
import com.argosquant.exceptions.AuthenticationFailedException;
import com.argosquant.exceptions.EmailAlreadyExistsException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Public authentication endpoints: register and login both return a JWT. */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResult register(@RequestBody RegistrationCommand command) throws EmailAlreadyExistsException {
        return authService.register(command);
    }

    @PostMapping("/login")
    public AuthResult login(@RequestBody LoginCommand command) throws AuthenticationFailedException {
        return authService.login(command);
    }
}

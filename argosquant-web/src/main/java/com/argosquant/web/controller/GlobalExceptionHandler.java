package com.argosquant.web.controller;

import com.argosquant.exceptions.AuthenticationFailedException;
import com.argosquant.exceptions.DuplicateResourceException;
import com.argosquant.exceptions.EmailAlreadyExistsException;
import com.argosquant.exceptions.InsufficientHoldingsException;
import com.argosquant.exceptions.InvalidTransactionException;
import com.argosquant.exceptions.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

/** Translates checked business exceptions and bad input into structured HTTP error responses. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthenticationFailedException.class)
    public ResponseEntity<Map<String, Object>> onAuthFailed(AuthenticationFailedException e) {
        return error(HttpStatus.UNAUTHORIZED, e.getMessage());
    }

    @ExceptionHandler({EmailAlreadyExistsException.class, DuplicateResourceException.class})
    public ResponseEntity<Map<String, Object>> onConflict(Exception e) {
        return error(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> onNotFound(ResourceNotFoundException e) {
        return error(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler({InsufficientHoldingsException.class, InvalidTransactionException.class})
    public ResponseEntity<Map<String, Object>> onUnprocessable(Exception e) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, e.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> onBadRequest(IllegalArgumentException e) {
        return error(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message == null ? "" : message));
    }
}

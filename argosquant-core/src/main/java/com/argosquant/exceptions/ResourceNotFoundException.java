package com.argosquant.exceptions;

/** Thrown when a requested entity (portfolio, holding, ...) does not exist or is not owned by the caller. */
public class ResourceNotFoundException extends ArgosException {

    public ResourceNotFoundException(String resource, Object id) {
        super(resource + " not found: " + id);
    }
}

package com.meridian.sam.auth;

public class AccessDeniedException extends RuntimeException {
    public AccessDeniedException(String message) { super(message); }
}

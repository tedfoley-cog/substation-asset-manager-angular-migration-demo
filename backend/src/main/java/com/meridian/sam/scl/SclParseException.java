package com.meridian.sam.scl;

public class SclParseException extends RuntimeException {
    public SclParseException(String message) { super(message); }
    public SclParseException(String message, Throwable cause) { super(message, cause); }
}

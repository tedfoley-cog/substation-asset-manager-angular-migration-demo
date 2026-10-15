package com.meridian.sam.service;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String type, Object id) { super(type + " " + id + " not found"); }
}

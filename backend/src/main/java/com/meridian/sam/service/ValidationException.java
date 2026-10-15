package com.meridian.sam.service;

import java.util.List;

public class ValidationException extends RuntimeException {
    private final List<String> violations;
    public ValidationException(List<String> violations) {
        super("Validation failed: " + String.join("; ", violations));
        this.violations = violations;
    }
    public List<String> getViolations() { return violations; }
}

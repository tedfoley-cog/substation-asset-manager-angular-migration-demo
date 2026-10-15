package com.meridian.sam.web;

import com.meridian.sam.auth.AccessDeniedException;
import com.meridian.sam.service.NotFoundException;
import com.meridian.sam.service.ValidationException;
import com.meridian.sam.web.dto.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.OffsetDateTime;
import java.util.List;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiError> notFound(NotFoundException e, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, e.getMessage(), List.of(), req);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> denied(AccessDeniedException e, HttpServletRequest req) {
        return build(HttpStatus.FORBIDDEN, e.getMessage(), List.of(), req);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiError> invalid(ValidationException e, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, "Validation failed", e.getViolations(), req);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> beanValidation(MethodArgumentNotValidException e, HttpServletRequest req) {
        List<String> details = e.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getField() + ": " + f.getDefaultMessage()).sorted().toList();
        return build(HttpStatus.BAD_REQUEST, "Validation failed", details, req);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> typeMismatch(MethodArgumentTypeMismatchException e, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, "Invalid value for parameter " + e.getName(), List.of(String.valueOf(e.getValue())), req);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> tooLarge(MaxUploadSizeExceededException e, HttpServletRequest req) {
        return build(HttpStatus.PAYLOAD_TOO_LARGE, "Upload exceeds the 20 MB limit", List.of(), req);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> unexpected(Exception e, HttpServletRequest req) {
        log.error("Unhandled error on {} {}", req.getMethod(), req.getRequestURI(), e);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error", List.of(), req);
    }

    private static ResponseEntity<ApiError> build(HttpStatus status, String message, List<String> details, HttpServletRequest req) {
        return ResponseEntity.status(status).body(new ApiError(OffsetDateTime.now(), status.value(),
            status.getReasonPhrase(), message, details, req.getRequestURI()));
    }
}

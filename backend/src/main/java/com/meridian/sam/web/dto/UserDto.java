package com.meridian.sam.web.dto;

public record UserDto(Long id, String username, String displayName, String role, String locale, boolean active) {}

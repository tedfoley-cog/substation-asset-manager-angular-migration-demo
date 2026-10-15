package com.meridian.sam.web.dto;

import java.util.List;

public record CurrentUserDto(String username, String displayName, String role, String locale, boolean authenticated,
                             List<String> permissions) {}

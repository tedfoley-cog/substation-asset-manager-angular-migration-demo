package com.meridian.sam.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "sam.auth")
public record AuthProperties(String header, String defaultUser) {}

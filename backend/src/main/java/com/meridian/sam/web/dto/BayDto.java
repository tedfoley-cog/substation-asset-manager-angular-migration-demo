package com.meridian.sam.web.dto;

import java.math.BigDecimal;

public record BayDto(Long id, Long substationId, String name, String bayType, BigDecimal nominalKv, int iedCount) {}

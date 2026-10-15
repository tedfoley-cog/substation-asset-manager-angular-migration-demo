package com.meridian.sam.web.dto;

import com.meridian.sam.domain.IedStatus;
import jakarta.validation.constraints.NotNull;

public record StatusChangeRequest(@NotNull IedStatus status) {}

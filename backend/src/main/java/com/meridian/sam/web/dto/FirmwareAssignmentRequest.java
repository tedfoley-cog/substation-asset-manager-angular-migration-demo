package com.meridian.sam.web.dto;

import jakarta.validation.constraints.NotNull;

public record FirmwareAssignmentRequest(@NotNull Long firmwareVersionId) {}

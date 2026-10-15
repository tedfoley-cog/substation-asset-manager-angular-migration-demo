package com.meridian.sam.web.dto;

import java.time.OffsetDateTime;
import java.util.List;

/** Standard error envelope. See standards/INTERFACE_CONTRACT_STANDARD.md section 4. */
public record ApiError(OffsetDateTime timestamp, int status, String error, String message, List<String> details, String path) {}

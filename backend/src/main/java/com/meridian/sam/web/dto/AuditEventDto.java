package com.meridian.sam.web.dto;

import java.time.OffsetDateTime;

public record AuditEventDto(Long id, OffsetDateTime occurredAt, String actor, String action, String entityType,
                            String entityId, String outcome, String details, String clientIp) {}

package com.meridian.sam.web.dto;

import java.time.OffsetDateTime;

public record DisturbanceRecordDto(Long id, String recordId, Long iedId, String iedName, String substationCode,
                                   OffsetDateTime triggeredAt, String triggerSource, String faultType, int durationMs,
                                   int sampleRateHz, int analogChannels, int digitalChannels, String fileFormat,
                                   long sizeBytes, boolean downloaded, String downloadedBy, OffsetDateTime downloadedAt) {}

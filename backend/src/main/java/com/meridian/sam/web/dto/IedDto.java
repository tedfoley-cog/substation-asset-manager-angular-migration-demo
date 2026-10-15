package com.meridian.sam.web.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record IedDto(Long id, String name, String deviceType, String platform, String model, String serialNumber,
                     String ipAddress, String status, LocalDate installedOn, OffsetDateTime lastSettingsUploadAt,
                     OffsetDateTime lastSeenAt, Long substationId, String substationCode, String substationName,
                     Long bayId, String bayName, FirmwareDto firmware,
                     Integer activeSettingsVersion, long settingsFileCount, long recordCount, String sclIedName) {}

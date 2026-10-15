package com.meridian.sam.web.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record SettingsFileDto(Long id, Long iedId, String iedName, int versionNo, String filename, String status,
                              String uploadedBy, OffsetDateTime uploadedAt, String checksumSha256, String comment,
                              Integer valueCount, List<SettingValueDto> values) {}

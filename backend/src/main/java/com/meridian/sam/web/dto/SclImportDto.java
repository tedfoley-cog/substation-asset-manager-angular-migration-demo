package com.meridian.sam.web.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record SclImportDto(Long id, String filename, String fileType, String sclVersion, String substationCode,
                           int iedCount, String status, String message, String importedBy, OffsetDateTime importedAt,
                           long sizeBytes, String checksumSha256, List<SclImportIedDto> ieds) {}

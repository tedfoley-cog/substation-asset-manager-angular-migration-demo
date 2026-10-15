package com.meridian.sam.web.dto;

import java.time.LocalDate;

public record FirmwareDto(Long id, String platform, String version, LocalDate releasedOn, boolean approved,
                          boolean endOfLife, String notes) {}

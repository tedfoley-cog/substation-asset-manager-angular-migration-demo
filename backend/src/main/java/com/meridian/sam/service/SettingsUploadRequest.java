package com.meridian.sam.service;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record SettingsUploadRequest(@Size(max = 512) String comment, boolean draft, @NotEmpty @Valid List<Value> values) {
    public record Value(@NotBlank @Size(max = 32) String settingGroup, @NotBlank @Size(max = 8) String lnClass,
                        @NotBlank @Size(max = 64) String name, @Size(max = 64) String value, @Size(max = 16) String unit,
                        @Size(max = 32) String minValue, @Size(max = 32) String maxValue) {}
}

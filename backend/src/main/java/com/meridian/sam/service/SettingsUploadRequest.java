package com.meridian.sam.service;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * {@code supersedeExisting} only applies to non-draft uploads: when true (the default when omitted) every currently
 * enforced file of the IED is superseded; when false the new file is enforced alongside them.
 */
public record SettingsUploadRequest(@Size(max = 512) String comment, boolean draft, @NotEmpty @Valid List<Value> values,
                                    Boolean supersedeExisting) {
    public SettingsUploadRequest(String comment, boolean draft, List<Value> values) { this(comment, draft, values, null); }

    public boolean supersedes() { return !draft && !Boolean.FALSE.equals(supersedeExisting); }

    public record Value(@NotBlank @Size(max = 32) String settingGroup, @NotBlank @Size(max = 8) String lnClass,
                        @NotBlank @Size(max = 64) String name, @Size(max = 64) String value, @Size(max = 16) String unit,
                        @Size(max = 32) String minValue, @Size(max = 32) String maxValue) {}
}

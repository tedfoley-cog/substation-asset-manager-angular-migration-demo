package com.meridian.sam.service;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

class SettingsServiceValidationTest {
    private final SettingsService service = new SettingsService(null, null, null, null);

    private static SettingsUploadRequest.Value v(String name, String value, String min, String max) {
        return new SettingsUploadRequest.Value("Group 1", "PDIF", name, value, "pu", min, max);
    }

    @Test
    void inRangeNumericValuesPass() {
        assertThat(service.validate(new SettingsUploadRequest("ok", false, List.of(v("87T Pickup", "0.30", "0.10", "1.00"))))).isEmpty();
    }

    @Test
    void outOfRangeValuesAreReportedWithLimits() {
        List<String> out = service.validate(new SettingsUploadRequest(null, false,
            List.of(v("87T Slope 2", "95", "40", "90"), v("87T Pickup", "0.05", "0.10", "1.00"))));
        assertThat(out).containsExactly("87T Slope 2: 95 exceeds maximum 90", "87T Pickup: 0.05 is below minimum 0.10");
    }

    @Test
    void blankValueIsAViolationNotZero() {
        List<String> out = service.validate(new SettingsUploadRequest(null, false, List.of(v("87T Pickup", "  ", "0.10", "1.00"))));
        assertThat(out).containsExactly("87T Pickup: value is required (blank is not zero)");
    }

    @Test
    void enumeratedSettingsSkipRangeCheck() {
        assertThat(service.validate(new SettingsUploadRequest(null, false, List.of(v("51P Curve", "IEC-VI", null, null))))).isEmpty();
    }

    @Test
    void emptyValueListIsRejected() {
        assertThat(service.validate(new SettingsUploadRequest(null, false, List.of()))).containsExactly("At least one setting value is required");
    }
}

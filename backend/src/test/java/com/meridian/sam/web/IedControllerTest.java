package com.meridian.sam.web;

import org.junit.jupiter.api.Test;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class IedControllerTest extends ApiTestSupport {

    @Test
    void listsWholeFleetSortedByName() throws Exception {
        mvc.perform(get("/api/ieds"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(20)))
            .andExpect(jsonPath("$[0].name").value("CEN01_BC_BCU"))
            .andExpect(jsonPath("$[0].substationCode").value("CEN-01"))
            .andExpect(jsonPath("$[0].firmware.version").value("7.5.0"))
            .andExpect(jsonPath("$[0].firmware.approved").value(false));
    }

    @Test
    void filtersByDeviceTypeAndFreeText() throws Exception {
        mvc.perform(get("/api/ieds").param("deviceType", "TRANSFORMER_DIFFERENTIAL").param("q", "sgt"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].name", contains("CEN01_SGT2_87T", "CEN01_SGT3_87T", "NTH02_SGT1_87T")));
    }

    @Test
    void unknownEnumValueProducesErrorEnvelope() throws Exception {
        mvc.perform(get("/api/ieds").param("deviceType", "TOASTER"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.message").value("Invalid value for parameter deviceType"))
            .andExpect(jsonPath("$.details[0]").value("TOASTER"))
            .andExpect(jsonPath("$.path").value("/api/ieds"));
    }

    @Test
    void missingIedIs404() throws Exception {
        mvc.perform(get("/api/ieds/9999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("IED 9999 not found"));
    }

    @Test
    void firmwareAssignmentRequiresProtectionAdminAndMatchingPlatform() throws Exception {
        mvc.perform(put("/api/ieds/{id}/firmware", 1).header(USER_HEADER, "mbrandt")
                .contentType("application/json").content("{\"firmwareVersionId\": 2}"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("Role ENGINEER may not assign firmware"));

        mvc.perform(put("/api/ieds/{id}/firmware", 1).header(USER_HEADER, "rvasquez")
                .contentType("application/json").content("{\"firmwareVersionId\": 4}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.details[0]", containsString("does not match IED platform")));

        mvc.perform(put("/api/ieds/{id}/firmware", 1).header(USER_HEADER, "rvasquez")
                .contentType("application/json").content("{\"firmwareVersionId\": 3}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.firmware.version").value("2.50.03"));

        mvc.perform(get("/api/audit").header(USER_HEADER, "rvasquez").param("action", "FIRMWARE_ASSIGN"))
            .andExpect(jsonPath("$[0].outcome").value("SUCCESS"))
            .andExpect(jsonPath("$[0].details", containsString("2.50.03 (unapproved)")));
    }
}

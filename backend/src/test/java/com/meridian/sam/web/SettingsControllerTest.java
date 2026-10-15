package com.meridian.sam.web;

import org.junit.jupiter.api.Test;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SettingsControllerTest extends ApiTestSupport {
    private static final String BODY = """
        {"comment":"%s","draft":%s,"values":[
          {"settingGroup":"Group 1","lnClass":"PDIF","name":"87T Pickup","value":"%s","unit":"pu","minValue":"0.10","maxValue":"1.00"},
          {"settingGroup":"Group 1","lnClass":"PDIF","name":"87T Slope 1","value":"25","unit":"%%","minValue":"15","maxValue":"50"}]}
        """;

    @Test
    void historyIsNewestFirstWithoutValues() throws Exception {
        mvc.perform(get("/api/ieds/{id}/settings", 1))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(3)))
            .andExpect(jsonPath("$[0].versionNo").value(3))
            .andExpect(jsonPath("$[0].status").value("ACTIVE"))
            .andExpect(jsonPath("$[0].filename").value("NTH01_T1_87T_v003.rsf"))
            .andExpect(jsonPath("$[0].values").doesNotExist());
    }

    @Test
    void fileDetailIncludesValuesWithUnitsAndLimits() throws Exception {
        mvc.perform(get("/api/settings/{id}", 1))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.iedName").value("NTH01_T1_87T"))
            .andExpect(jsonPath("$.values", hasSize(19)))
            .andExpect(jsonPath("$.values[?(@.name=='87T Pickup' && @.settingGroup=='Group 1')].value").value("0.30"))
            .andExpect(jsonPath("$.values[?(@.name=='87T Pickup' && @.settingGroup=='Group 1')].unit").value("pu"));
    }

    @Test
    void viewerCannotUploadAndDenialIsAudited() throws Exception {
        mvc.perform(post("/api/ieds/{id}/settings", 1).header(USER_HEADER, "lchen")
                .contentType("application/json").content(BODY.formatted("x", false, "0.30")))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("Role VIEWER may not upload settings"));
        mvc.perform(get("/api/audit").header(USER_HEADER, "sdubois").param("actor", "lchen").param("action", "SETTINGS_UPLOAD"))
            .andExpect(jsonPath("$[0].outcome").value("DENIED"));
    }

    @Test
    void outOfRangeUploadIsRejectedWithDetails() throws Exception {
        mvc.perform(post("/api/ieds/{id}/settings", 1).header(USER_HEADER, "mbrandt")
                .contentType("application/json").content(BODY.formatted("x", false, "1.50")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Validation failed"))
            .andExpect(jsonPath("$.details[0]").value("87T Pickup: 1.50 exceeds maximum 1.00"));
    }

    @Test
    void engineerUploadCreatesNextVersionAndSupersedesActive() throws Exception {
        mvc.perform(post("/api/ieds/{id}/settings", 1).header(USER_HEADER, "mbrandt")
                .contentType("application/json").content(BODY.formatted("Retuned after FS-2024-07", false, "0.35")))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.versionNo").value(4))
            .andExpect(jsonPath("$.filename").value("NTH01_T1_87T_v004.rsf"))
            .andExpect(jsonPath("$.status").value("ACTIVE"))
            .andExpect(jsonPath("$.uploadedBy").value("mbrandt"))
            .andExpect(jsonPath("$.checksumSha256", hasLength(64)))
            .andExpect(jsonPath("$.values", hasSize(2)));
        mvc.perform(get("/api/ieds/{id}/settings", 1))
            .andExpect(jsonPath("$[1].versionNo").value(3))
            .andExpect(jsonPath("$[1].status").value("SUPERSEDED"));
    }

    @Test
    void beanValidationRejectsMissingNames() throws Exception {
        mvc.perform(post("/api/ieds/{id}/settings", 1).header(USER_HEADER, "mbrandt")
                .contentType("application/json")
                .content("{\"values\":[{\"settingGroup\":\"Group 1\",\"lnClass\":\"PDIF\",\"value\":\"1\"}]}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.details[0]", startsWith("values[0].name")));
    }
}

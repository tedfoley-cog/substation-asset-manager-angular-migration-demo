package com.meridian.sam.web;

import org.junit.jupiter.api.Test;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SettingsControllerTest extends ApiTestSupport {
    private static final String BODY_KEEP_ENFORCED = """
        {"comment":"Group 2 overlay for FS-2024-07","draft":false,"supersedeExisting":false,"values":[
          {"settingGroup":"Group 2","lnClass":"PDIF","name":"87T Pickup","value":"0.40","unit":"pu","minValue":"0.10","maxValue":"1.00"}]}
        """;
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

    @Test
    void uploadWithoutSupersedeEnforcesAlongsideExistingFile() throws Exception {
        mvc.perform(post("/api/ieds/{id}/settings", 1).header(USER_HEADER, "mbrandt")
                .contentType("application/json").content(BODY_KEEP_ENFORCED))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.versionNo").value(4))
            .andExpect(jsonPath("$.status").value("ACTIVE"));
        mvc.perform(get("/api/ieds/{id}/settings", 1))
            .andExpect(jsonPath("$[1].versionNo").value(3))
            .andExpect(jsonPath("$[1].status").value("ACTIVE"));
        mvc.perform(get("/api/ieds/{id}/settings/enforced", 1))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].versionNo", contains(4, 3)));
        mvc.perform(get("/api/ieds/{id}", 1))
            .andExpect(jsonPath("$.activeSettingsVersion").value(4))
            .andExpect(jsonPath("$.enforcedSettingsVersions", contains(4, 3)));
        mvc.perform(get("/api/audit").header(USER_HEADER, "sdubois").param("actor", "mbrandt").param("action", "SETTINGS_UPLOAD"))
            .andExpect(jsonPath("$[0].details").value("Uploaded NTH01_T1_87T_v004.rsf (enforced alongside existing)"));
    }

    @Test
    void draftUploadNeverSupersedesEnforcedFiles() throws Exception {
        mvc.perform(post("/api/ieds/{id}/settings", 1).header(USER_HEADER, "mbrandt")
                .contentType("application/json").content(BODY.formatted("Draft for FS-2024-07", true, "0.35")))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("DRAFT"));
        mvc.perform(get("/api/ieds/{id}/settings/enforced", 1))
            .andExpect(jsonPath("$[*].versionNo", contains(3)));
    }

    @Test
    void enforcingASupersededFileAddsItToTheEnforcedSetAndIsAudited() throws Exception {
        mvc.perform(post("/api/settings/{id}/enforce", 2).header(USER_HEADER, "mbrandt"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.versionNo").value(2))
            .andExpect(jsonPath("$.status").value("ACTIVE"));
        mvc.perform(get("/api/ieds/{id}", 1))
            .andExpect(jsonPath("$.activeSettingsVersion").value(3))
            .andExpect(jsonPath("$.enforcedSettingsVersions", contains(3, 2)));
        mvc.perform(get("/api/audit").header(USER_HEADER, "sdubois").param("actor", "mbrandt").param("action", "SETTINGS_ENFORCE"))
            .andExpect(jsonPath("$[0].outcome").value("SUCCESS"))
            .andExpect(jsonPath("$[0].details").value("NTH01_T1_87T_v002.rsf: SUPERSEDED -> ACTIVE"));
    }

    @Test
    void withdrawingTheOnlyEnforcedFileLeavesNoneEnforced() throws Exception {
        mvc.perform(post("/api/settings/{id}/unenforce", 3).header(USER_HEADER, "rvasquez"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("SUPERSEDED"));
        mvc.perform(get("/api/ieds/{id}/settings/enforced", 1)).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/ieds/{id}", 1))
            .andExpect(jsonPath("$.activeSettingsVersion").doesNotExist())
            .andExpect(jsonPath("$.enforcedSettingsVersions", hasSize(0)));
    }

    @Test
    void enforcingAnAlreadyEnforcedFileIsRejected() throws Exception {
        mvc.perform(post("/api/settings/{id}/enforce", 3).header(USER_HEADER, "mbrandt"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.details[0]").value("NTH01_T1_87T_v003.rsf is already enforced"));
        mvc.perform(post("/api/settings/{id}/unenforce", 2).header(USER_HEADER, "mbrandt"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.details[0]").value("NTH01_T1_87T_v002.rsf is not enforced"));
    }

    @Test
    void viewerCannotEnforceAndDenialIsAudited() throws Exception {
        mvc.perform(post("/api/settings/{id}/enforce", 2).header(USER_HEADER, "lchen"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("Role VIEWER may not enforce settings"));
        mvc.perform(get("/api/audit").header(USER_HEADER, "sdubois").param("actor", "lchen").param("action", "SETTINGS_ENFORCE"))
            .andExpect(jsonPath("$[0].outcome").value("DENIED"));
        mvc.perform(get("/api/ieds/{id}/settings/enforced", 1))
            .andExpect(jsonPath("$[*].versionNo", contains(3)));
    }
}

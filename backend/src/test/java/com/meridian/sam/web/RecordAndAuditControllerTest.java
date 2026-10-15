package com.meridian.sam.web;

import org.junit.jupiter.api.Test;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RecordAndAuditControllerTest extends ApiTestSupport {

    @Test
    void recordsFilterByDownloadedFlagAndSubstation() throws Exception {
        mvc.perform(get("/api/records").param("downloaded", "false").param("substationId", "1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].recordId").value("NTH01_T1_87T_20240602_193011"))
            .andExpect(jsonPath("$[0].triggerSource").value("51P Pickup"))
            .andExpect(jsonPath("$[0].fileFormat").value("COMTRADE_2013"));
    }

    @Test
    void downloadReturnsComtradeCfgAndMarksRecord() throws Exception {
        mvc.perform(post("/api/records/{id}/download", 3).header(USER_HEADER, "mbrandt"))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Disposition", "attachment; filename=\"NTH01_T1_87T_20240602_193011.cfg\""))
            .andExpect(content().string(startsWith("NTH-01,NTH01_T1_87T,2013\n44,12A,32D\n1,IA,,,A,0.001")))
            .andExpect(content().string(containsString("\n4800,4800\n")))
            .andExpect(content().string(endsWith("BINARY\n1.0\n+0h00\n1\n")));
        mvc.perform(get("/api/records/{id}", 3))
            .andExpect(jsonPath("$.downloaded").value(true))
            .andExpect(jsonPath("$.downloadedBy").value("mbrandt"));
    }

    @Test
    void auditorCannotDownloadButCanReadAudit() throws Exception {
        mvc.perform(post("/api/records/{id}/download", 3).header(USER_HEADER, "sdubois"))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/audit").header(USER_HEADER, "sdubois").param("actor", "sdubois"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].action").value("RECORD_DOWNLOAD"))
            .andExpect(jsonPath("$[0].outcome").value("DENIED"));
    }

    @Test
    void engineerCannotReadAuditTrail() throws Exception {
        mvc.perform(get("/api/audit").header(USER_HEADER, "mbrandt"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("Role ENGINEER may not read the audit trail"));
    }

    @Test
    void meReflectsHeaderIdentityAndInactiveUsersFallBackToAnonymous() throws Exception {
        mvc.perform(get("/api/me").header(USER_HEADER, "rvasquez"))
            .andExpect(jsonPath("$.role").value("PROTECTION_ADMIN"))
            .andExpect(jsonPath("$.permissions", hasItems("firmware:assign", "audit:read")));
        mvc.perform(get("/api/me").header(USER_HEADER, "jkowalski"))
            .andExpect(jsonPath("$.username").value("anonymous"))
            .andExpect(jsonPath("$.authenticated").value(false));
    }
}

package com.meridian.sam.web;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SclImportControllerTest extends ApiTestSupport {

    private MockMultipartFile fixture(String name) throws Exception {
        return new MockMultipartFile("file", name, "application/xml", Files.readAllBytes(Path.of("src/test/resources/scl/" + name)));
    }

    @Test
    void importHistoryIsNewestFirst() throws Exception {
        mvc.perform(get("/api/scl/imports"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(7)))
            .andExpect(jsonPath("$[0].filename").value("NTH-02_SGT1_refurb.scd"))
            .andExpect(jsonPath("$[0].status").value("FAILED"));
    }

    @Test
    void engineerImportsStationFileAndMatchesInventory() throws Exception {
        mvc.perform(multipart("/api/scl/imports").file(fixture("NTH-01_station.scd")).header(USER_HEADER, "aokafor"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("COMPLETED"))
            .andExpect(jsonPath("$.fileType").value("SCD"))
            .andExpect(jsonPath("$.sclVersion").value("2007B"))
            .andExpect(jsonPath("$.substationCode").value("NTH-01"))
            .andExpect(jsonPath("$.iedCount").value(4))
            .andExpect(jsonPath("$.message", startsWith("3 of 4 IEDs matched to inventory.")))
            .andExpect(jsonPath("$.ieds[?(@.iedName=='NTH01_T1_87T')].matchedIedName").value("NTH01_T1_87T"))
            .andExpect(jsonPath("$.ieds[?(@.iedName=='NTH01_T1_87T')].ipAddress").value("10.41.1.11"))
            .andExpect(jsonPath("$.ieds[?(@.iedName=='NTH01_HMI')].matchedIedId").isEmpty());
    }

    @Test
    void structurallyInvalidFileIsRecordedAsFailedImport() throws Exception {
        mvc.perform(multipart("/api/scl/imports").file(fixture("broken_subnetwork.scd")).header(USER_HEADER, "aokafor"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("FAILED"))
            .andExpect(jsonPath("$.message").value("Communication/SubNetwork is missing required attribute name"));
    }

    @Test
    void wrongExtensionIs400AndViewerIs403() throws Exception {
        mvc.perform(multipart("/api/scl/imports").file(fixture("not_scl.xml")).header(USER_HEADER, "aokafor"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.details[0]", startsWith("Unsupported SCL file extension .xml")));
        mvc.perform(multipart("/api/scl/imports").file(fixture("NTH-01_station.scd")).header(USER_HEADER, "lchen"))
            .andExpect(status().isForbidden());
    }
}

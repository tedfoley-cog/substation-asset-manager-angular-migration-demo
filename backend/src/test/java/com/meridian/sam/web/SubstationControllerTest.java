package com.meridian.sam.web;

import org.junit.jupiter.api.Test;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SubstationControllerTest extends ApiTestSupport {

    @Test
    void listsEstateSortedByCodeWithBayAndIedCounts() throws Exception {
        mvc.perform(get("/api/substations"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].code", contains("CEN-01", "NTH-01", "NTH-02", "STH-01", "STH-02")))
            .andExpect(jsonPath("$[*].bayCount", contains(4, 4, 3, 3, 3)))
            .andExpect(jsonPath("$[*].iedCount", contains(4, 5, 3, 3, 5)))
            .andExpect(jsonPath("$[0].bays").doesNotExist());
    }

    @Test
    void filtersByRegionIgnoringCaseAndSurroundingWhitespace() throws Exception {
        mvc.perform(get("/api/substations").param("region", " north "))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].code", contains("NTH-01", "NTH-02")))
            .andExpect(jsonPath("$[*].iedCount", contains(5, 3)));
    }

    @Test
    void unknownRegionIsEmptyList() throws Exception {
        mvc.perform(get("/api/substations").param("region", "Atlantis"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void detailIncludesBaysAndIedCount() throws Exception {
        mvc.perform(get("/api/substations/{id}", 3))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("CEN-01"))
            .andExpect(jsonPath("$.iedCount").value(4))
            .andExpect(jsonPath("$.bays", hasSize(4)))
            .andExpect(jsonPath("$.bays[*].substationId", everyItem(is(3))));
    }

    @Test
    void baysOfSubstationSortedByName() throws Exception {
        mvc.perform(get("/api/substations/{id}/bays", 3))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].name", contains("132 kV Bus Coupler", "Line 2 to NTH-02", "SGT2 400/132 kV", "SGT3 400/132 kV")));
    }

    @Test
    void missingSubstationIs404() throws Exception {
        mvc.perform(get("/api/substations/9999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Substation 9999 not found"));
        mvc.perform(get("/api/substations/9999/bays"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Substation 9999 not found"));
    }
}

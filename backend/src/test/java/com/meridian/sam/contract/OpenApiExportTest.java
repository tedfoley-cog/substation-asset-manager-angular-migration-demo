package com.meridian.sam.contract;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import java.nio.file.Files;
import java.nio.file.Path;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

/** Run with -Dsam.export.openapi=true to dump the live document to target/openapi.json for contract maintenance. */
@SpringBootTest
@AutoConfigureMockMvc
class OpenApiExportTest {
    @Autowired MockMvc mvc;

    @Test
    @EnabledIfSystemProperty(named = "sam.export.openapi", matches = "true")
    void export() throws Exception {
        String live = mvc.perform(get("/v3/api-docs")).andReturn().getResponse().getContentAsString();
        Files.createDirectories(Path.of("target"));
        Files.writeString(Path.of("target", "openapi.json"), live);
    }
}

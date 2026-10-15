package com.meridian.sam.contract;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

/**
 * OpenAPI-driven contract tests. The committed contract is api/openapi.yaml. Two guarantees:
 *  1. the running service exposes exactly the paths/methods in the contract (no drift either way);
 *  2. every GET operation that declares an x-contract-example executes against the seeded fixture data and
 *     its response conforms to the declared response schema (required fields present, no undeclared fields,
 *     primitive types match, nullable honoured).
 */
@SpringBootTest
@AutoConfigureMockMvc
class OpenApiContractTest {
    private static final Path CONTRACT = Path.of("..", "api", "openapi.yaml");
    private static JsonNode contract;
    private static final ObjectMapper JSON = new ObjectMapper();

    @Autowired MockMvc mvc;

    @BeforeAll
    static void loadContract() throws Exception {
        contract = new ObjectMapper(new YAMLFactory()).readTree(Files.readString(CONTRACT));
    }

    @Test
    void liveDocumentMatchesCommittedContract() throws Exception {
        String live = mvc.perform(get("/v3/api-docs")).andReturn().getResponse().getContentAsString();
        Set<String> liveOps = operations(JSON.readTree(live));
        Set<String> contractOps = operations(contract);
        assertThat(liveOps).as("operations exposed by the service vs api/openapi.yaml").containsExactlyInAnyOrderElementsOf(contractOps);
    }

    @TestFactory
    Stream<DynamicTest> responsesConformToSchema() {
        List<DynamicTest> tests = new ArrayList<>();
        contract.get("paths").fields().forEachRemaining(path -> path.getValue().fields().forEachRemaining(op -> {
            JsonNode example = op.getValue().get("x-contract-example");
            if (example == null || !"get".equals(op.getKey())) return;
            tests.add(DynamicTest.dynamicTest(op.getKey().toUpperCase() + " " + path.getKey() + " -> " + example.get("request").asText(), () -> {
                var req = get(example.get("request").asText());
                if (example.has("user")) req = req.header("X-SAM-User", example.get("user").asText());
                MvcResult res = mvc.perform(req).andReturn();
                String expectedStatus = example.has("status") ? example.get("status").asText() : "200";
                assertThat(String.valueOf(res.getResponse().getStatus())).isEqualTo(expectedStatus);
                JsonNode schema = op.getValue().path("responses").path(expectedStatus).path("content").path("*/*").path("schema");
                if (schema.isMissingNode()) schema = op.getValue().path("responses").path(expectedStatus).path("content").path("application/json").path("schema");
                assertThat(schema.isMissingNode()).as("schema for " + expectedStatus).isFalse();
                JsonNode body = JSON.readTree(res.getResponse().getContentAsString());
                List<String> problems = new ArrayList<>();
                validate(body, schema, "$", problems);
                assertThat(problems).isEmpty();
                if (example.has("minItems")) assertThat(body.size()).isGreaterThanOrEqualTo(example.get("minItems").asInt());
            }));
        }));
        return tests.stream();
    }

    static Set<String> operations(JsonNode doc) {
        Set<String> out = new TreeSet<>();
        doc.get("paths").fields().forEachRemaining(p -> p.getValue().fieldNames().forEachRemaining(m -> out.add(m.toUpperCase() + " " + p.getKey())));
        return out;
    }

    static void validate(JsonNode value, JsonNode schema, String at, List<String> problems) {
        if (schema.has("$ref")) {
            String ref = schema.get("$ref").asText().replace("#/components/schemas/", "");
            schema = contract.path("components").path("schemas").path(ref);
        }
        if (value == null || value.isNull()) {
            if (!schema.path("nullable").asBoolean(false)) problems.add(at + " is null but schema is not nullable");
            return;
        }
        String type = schema.path("type").asText("object");
        switch (type) {
            case "array" -> {
                if (!value.isArray()) { problems.add(at + " expected array"); return; }
                for (int i = 0; i < value.size(); i++) validate(value.get(i), schema.get("items"), at + "[" + i + "]", problems);
            }
            case "object" -> {
                if (!value.isObject()) { problems.add(at + " expected object"); return; }
                JsonNode props = schema.path("properties");
                for (JsonNode req : schema.path("required")) {
                    if (!value.has(req.asText())) problems.add(at + " missing required field " + req.asText());
                }
                Iterator<String> names = value.fieldNames();
                while (names.hasNext()) {
                    String n = names.next();
                    if (!props.has(n)) { problems.add(at + "." + n + " is not declared in the contract"); continue; }
                    validate(value.get(n), props.get(n), at + "." + n, problems);
                }
            }
            case "string" -> {
                if (!value.isTextual()) problems.add(at + " expected string, got " + value.getNodeType());
                if (schema.has("enum") && value.isTextual()) {
                    boolean ok = false; for (JsonNode e : schema.get("enum")) ok |= e.asText().equals(value.asText());
                    if (!ok) problems.add(at + " value " + value.asText() + " not in enum");
                }
            }
            case "integer" -> { if (!value.isIntegralNumber()) problems.add(at + " expected integer"); }
            case "number" -> { if (!value.isNumber()) problems.add(at + " expected number"); }
            case "boolean" -> { if (!value.isBoolean()) problems.add(at + " expected boolean"); }
            default -> problems.add(at + " unsupported schema type " + type);
        }
    }
}

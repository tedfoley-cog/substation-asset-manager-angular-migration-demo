#!/usr/bin/env python3
"""Regenerate api/openapi.yaml from the live springdoc document.

    cd backend && mvn -q test -Dsam.export.openapi=true -Dtest=OpenApiExportTest -Dsurefire.failIfNoSpecifiedTests=false
    python3 api/tools/regenerate_contract.py

The generated document is normalised (sorted, nullable/required made explicit) and the x-contract-example
entries below are attached so backend/src/test/java/com/meridian/sam/contract/OpenApiContractTest.java can
execute every GET against the seeded fixture data. Edit REQUIRED / EXAMPLES here, not the yaml.
"""
import json, pathlib, sys
import yaml

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "backend" / "target" / "openapi.json"
DST = ROOT / "api" / "openapi.yaml"

REQUIRED = {
    "SubstationDto": ["id", "code", "name", "region", "nominalKv", "bayCount", "iedCount"],
    "BayDto": ["id", "substationId", "name", "bayType", "nominalKv", "iedCount"],
    "IedDto": ["id", "name", "deviceType", "platform", "model", "serialNumber", "status", "substationId", "substationCode", "substationName", "bayId", "bayName"],
    "FirmwareDto": ["id", "platform", "version", "releasedOn", "approved", "endOfLife"],
    "SettingsFileDto": ["id", "iedId", "iedName", "versionNo", "filename", "status", "uploadedBy", "uploadedAt", "checksumSha256"],
    "SettingValueDto": ["settingGroup", "lnClass", "name"],
    "SclImportDto": ["id", "filename", "fileType", "iedCount", "status", "importedBy", "importedAt", "sizeBytes"],
    "SclImportIedDto": ["iedName", "lnClasses"],
    "DisturbanceRecordDto": ["id", "recordId", "iedId", "iedName", "substationCode", "triggeredAt", "triggerSource", "durationMs", "sampleRateHz", "analogChannels", "digitalChannels", "fileFormat", "sizeBytes", "downloaded"],
    "UserDto": ["id", "username", "displayName", "role", "locale", "active"],
    "CurrentUserDto": ["username", "displayName", "role", "locale", "authenticated", "permissions"],
    "AuditEventDto": ["id", "occurredAt", "actor", "action", "entityType", "outcome"],
}
ENUMS = {
    ("IedDto", "deviceType"): ["TRANSFORMER_DIFFERENTIAL", "LINE_DISTANCE", "FEEDER_PROTECTION", "BAY_CONTROLLER", "MERGING_UNIT"],
    ("IedDto", "status"): ["IN_SERVICE", "COMMISSIONING", "MAINTENANCE", "DECOMMISSIONED"],
    ("BayDto", "bayType"): ["TRANSFORMER", "LINE", "FEEDER", "BUSBAR"],
    ("SettingsFileDto", "status"): ["DRAFT", "ACTIVE", "SUPERSEDED"],
    ("SclImportDto", "status"): ["PENDING", "COMPLETED", "FAILED"],
    ("SclImportDto", "fileType"): ["ICD", "CID", "SCD", "SSD", "IID"],
    ("UserDto", "role"): ["VIEWER", "ENGINEER", "PROTECTION_ADMIN", "AUDITOR"],
    ("CurrentUserDto", "role"): ["VIEWER", "ENGINEER", "PROTECTION_ADMIN", "AUDITOR"],
    ("AuditEventDto", "outcome"): ["SUCCESS", "DENIED", "FAILURE"],
}
EXAMPLES = {
    "/api/substations": {"request": "/api/substations?region=North", "minItems": 2},
    "/api/substations/{id}": {"request": "/api/substations/1"},
    "/api/substations/{id}/bays": {"request": "/api/substations/1/bays", "minItems": 4},
    "/api/ieds": {"request": "/api/ieds?deviceType=LINE_DISTANCE&q=21", "minItems": 4},
    "/api/ieds/{id}": {"request": "/api/ieds/1"},
    "/api/firmware": {"request": "/api/firmware", "minItems": 10},
    "/api/ieds/{iedId}/settings": {"request": "/api/ieds/1/settings", "minItems": 3},
    "/api/settings/{fileId}": {"request": "/api/settings/1"},
    "/api/scl/imports": {"request": "/api/scl/imports", "minItems": 7},
    "/api/scl/imports/{id}": {"request": "/api/scl/imports/1"},
    "/api/records": {"request": "/api/records?substationId=1&downloaded=false", "minItems": 2},
    "/api/records/{id}": {"request": "/api/records/1"},
    "/api/users": {"request": "/api/users", "minItems": 6},
    "/api/me": {"request": "/api/me", "user": "mbrandt"},
    "/api/audit": {"request": "/api/audit?action=SETTINGS_UPLOAD", "user": "sdubois", "minItems": 5},
    "/api/audit/actions": {"request": "/api/audit/actions", "minItems": 10},
}

def main():
    doc = json.loads(SRC.read_text())
    doc["info"]["x-contract-note"] = "Committed API contract. Regenerate with api/tools/regenerate_contract.py; never hand-edit."
    schemas = doc["components"]["schemas"]
    for name, schema in schemas.items():
        req = REQUIRED.get(name)
        if req is None:
            continue
        schema["required"] = req
        for prop, pschema in schema.get("properties", {}).items():
            if prop not in req:
                pschema["nullable"] = True
            if (name, prop) in ENUMS:
                pschema["enum"] = ENUMS[(name, prop)]
    for path, ops in doc["paths"].items():
        if "get" in ops and path in EXAMPLES:
            ops["get"]["x-contract-example"] = EXAMPLES[path]
    missing = [p for p, ops in doc["paths"].items() if "get" in ops and p not in EXAMPLES]
    if missing:
        sys.exit("GET operations without x-contract-example: " + ", ".join(missing))
    DST.write_text(yaml.safe_dump(doc, sort_keys=True, width=120))
    print("wrote", DST, len(doc["paths"]), "paths", len(schemas), "schemas")

if __name__ == "__main__":
    main()

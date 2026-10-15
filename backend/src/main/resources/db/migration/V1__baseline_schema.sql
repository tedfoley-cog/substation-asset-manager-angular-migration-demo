-- Baseline schema for the Substation Asset Manager (SAM) service.
-- Written for PostgreSQL; executed against H2 in PostgreSQL compatibility mode in dev/CI.

CREATE TABLE app_user (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(64)  NOT NULL UNIQUE,
    display_name  VARCHAR(128) NOT NULL,
    role          VARCHAR(32)  NOT NULL,
    locale        VARCHAR(16)  NOT NULL DEFAULT 'en-GB',
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE substation (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(16)  NOT NULL UNIQUE,
    name            VARCHAR(128) NOT NULL,
    region          VARCHAR(64)  NOT NULL,
    nominal_kv      NUMERIC(6,1) NOT NULL,
    latitude        NUMERIC(9,6),
    longitude       NUMERIC(9,6),
    commissioned_on DATE,
    operator_notes  VARCHAR(1024)
);

CREATE TABLE bay (
    id            BIGSERIAL PRIMARY KEY,
    substation_id BIGINT       NOT NULL REFERENCES substation(id),
    name          VARCHAR(64)  NOT NULL,
    bay_type      VARCHAR(32)  NOT NULL,
    nominal_kv    NUMERIC(6,1) NOT NULL,
    UNIQUE (substation_id, name)
);

CREATE TABLE firmware_version (
    id          BIGSERIAL PRIMARY KEY,
    platform    VARCHAR(64)  NOT NULL,
    version     VARCHAR(32)  NOT NULL,
    released_on DATE         NOT NULL,
    approved    BOOLEAN      NOT NULL DEFAULT FALSE,
    end_of_life BOOLEAN      NOT NULL DEFAULT FALSE,
    notes       VARCHAR(1024),
    UNIQUE (platform, version)
);

CREATE TABLE ied (
    id                      BIGSERIAL PRIMARY KEY,
    bay_id                  BIGINT       NOT NULL REFERENCES bay(id),
    name                    VARCHAR(64)  NOT NULL UNIQUE,
    device_type             VARCHAR(32)  NOT NULL,
    platform                VARCHAR(64)  NOT NULL,
    model                   VARCHAR(64)  NOT NULL,
    serial_number           VARCHAR(64)  NOT NULL UNIQUE,
    ip_address              VARCHAR(45),
    firmware_version_id     BIGINT       REFERENCES firmware_version(id),
    status                  VARCHAR(32)  NOT NULL,
    installed_on            DATE,
    last_settings_upload_at TIMESTAMP WITH TIME ZONE,
    last_seen_at            TIMESTAMP WITH TIME ZONE
);

CREATE INDEX ix_ied_bay ON ied(bay_id);
CREATE INDEX ix_ied_status ON ied(status);

CREATE TABLE settings_file (
    id             BIGSERIAL PRIMARY KEY,
    ied_id         BIGINT       NOT NULL REFERENCES ied(id),
    version_no     INTEGER      NOT NULL,
    filename       VARCHAR(255) NOT NULL,
    status         VARCHAR(16)  NOT NULL,
    uploaded_by    VARCHAR(64)  NOT NULL,
    uploaded_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    comment        VARCHAR(512),
    UNIQUE (ied_id, version_no)
);

CREATE TABLE setting_value (
    id               BIGSERIAL PRIMARY KEY,
    settings_file_id BIGINT       NOT NULL REFERENCES settings_file(id) ON DELETE CASCADE,
    setting_group    VARCHAR(32)  NOT NULL,
    ln_class         VARCHAR(8)   NOT NULL,
    name             VARCHAR(64)  NOT NULL,
    val              VARCHAR(64),
    unit             VARCHAR(16),
    min_value        VARCHAR(32),
    max_value        VARCHAR(32),
    UNIQUE (settings_file_id, setting_group, name)
);

CREATE INDEX ix_setting_value_file ON setting_value(settings_file_id);

CREATE TABLE scl_import (
    id               BIGSERIAL PRIMARY KEY,
    filename         VARCHAR(255) NOT NULL,
    file_type        VARCHAR(8)   NOT NULL,
    scl_version      VARCHAR(16),
    substation_code  VARCHAR(16),
    ied_count        INTEGER      NOT NULL DEFAULT 0,
    status           VARCHAR(16)  NOT NULL,
    message          VARCHAR(1024),
    imported_by      VARCHAR(64)  NOT NULL,
    imported_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    size_bytes       BIGINT       NOT NULL DEFAULT 0
);

CREATE TABLE scl_import_ied (
    id             BIGSERIAL PRIMARY KEY,
    scl_import_id  BIGINT       NOT NULL REFERENCES scl_import(id) ON DELETE CASCADE,
    ied_name       VARCHAR(64)  NOT NULL,
    manufacturer   VARCHAR(64),
    type           VARCHAR(64),
    config_version VARCHAR(32),
    access_point   VARCHAR(64),
    ip_address     VARCHAR(45),
    ln_classes     VARCHAR(512),
    matched_ied_id BIGINT       REFERENCES ied(id)
);

CREATE TABLE disturbance_record (
    id             BIGSERIAL PRIMARY KEY,
    ied_id         BIGINT       NOT NULL REFERENCES ied(id),
    record_id      VARCHAR(64)  NOT NULL UNIQUE,
    triggered_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    trigger_source VARCHAR(64)  NOT NULL,
    fault_type     VARCHAR(16),
    duration_ms    INTEGER      NOT NULL,
    sample_rate_hz INTEGER      NOT NULL,
    analog_channels  INTEGER    NOT NULL,
    digital_channels INTEGER    NOT NULL,
    file_format    VARCHAR(16)  NOT NULL,
    size_bytes     BIGINT       NOT NULL,
    downloaded     BOOLEAN      NOT NULL DEFAULT FALSE,
    downloaded_by  VARCHAR(64),
    downloaded_at  TIMESTAMP WITH TIME ZONE
);

CREATE INDEX ix_record_ied ON disturbance_record(ied_id);
CREATE INDEX ix_record_triggered ON disturbance_record(triggered_at);

CREATE TABLE audit_event (
    id           BIGSERIAL PRIMARY KEY,
    occurred_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    actor        VARCHAR(64)  NOT NULL,
    action       VARCHAR(64)  NOT NULL,
    entity_type  VARCHAR(32)  NOT NULL,
    entity_id    VARCHAR(64),
    outcome      VARCHAR(16)  NOT NULL,
    details      VARCHAR(2048),
    client_ip    VARCHAR(45)
);

CREATE INDEX ix_audit_occurred ON audit_event(occurred_at);
CREATE INDEX ix_audit_actor ON audit_event(actor);

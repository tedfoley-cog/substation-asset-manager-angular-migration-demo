package com.meridian.sam.domain;

public enum Role {
    VIEWER, ENGINEER, PROTECTION_ADMIN, AUDITOR;

    public boolean canUploadSettings() { return this == ENGINEER || this == PROTECTION_ADMIN; }
    public boolean canImportScl() { return this == ENGINEER || this == PROTECTION_ADMIN; }
    public boolean canAssignFirmware() { return this == PROTECTION_ADMIN; }
    public boolean canDownloadRecords() { return this != AUDITOR; }
    public boolean canReadAudit() { return this == AUDITOR || this == PROTECTION_ADMIN; }
}

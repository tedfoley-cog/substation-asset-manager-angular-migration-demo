package com.meridian.sam.service;

/** Per-IED summary figures shown in the inventory drawer and overview; derived, never stored. */
public record IedStats(Integer activeSettingsVersion, long settingsFileCount, long recordCount, String sclIedName) {
    public static final IedStats NONE = new IedStats(null, 0, 0, null);
}

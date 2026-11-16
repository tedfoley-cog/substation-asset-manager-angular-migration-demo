package com.meridian.sam.service;

import java.util.List;

/**
 * Per-IED summary figures shown in the inventory drawer and overview; derived, never stored.
 * {@code activeSettingsVersion} is the newest enforced version; {@code enforcedSettingsVersions} lists all of them, newest first.
 */
public record IedStats(Integer activeSettingsVersion, List<Integer> enforcedSettingsVersions, long settingsFileCount,
                       long recordCount, String sclIedName) {
    public static final IedStats NONE = new IedStats(null, List.of(), 0, 0, null);
}

package com.meridian.sam.scl;

import java.util.List;

/** The subset of an IEC 61850-6 SCL file the asset manager cares about. */
public record SclDocument(String version, String revision, String headerId, String toolId, String substationName,
                          List<SclIed> ieds, List<String> warnings) {
    public record SclIed(String name, String manufacturer, String type, String configVersion, String accessPoint,
                         String ipAddress, List<String> lnClasses) {}
}

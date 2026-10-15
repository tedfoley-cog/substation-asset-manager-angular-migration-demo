package com.meridian.sam.web.dto;

import java.util.List;

public record SclImportIedDto(String iedName, String manufacturer, String type, String configVersion, String accessPoint,
                              String ipAddress, List<String> lnClasses, Long matchedIedId, String matchedIedName) {}

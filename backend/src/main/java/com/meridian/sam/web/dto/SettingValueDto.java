package com.meridian.sam.web.dto;

public record SettingValueDto(String settingGroup, String lnClass, String name, String value, String unit,
                              String minValue, String maxValue) {}

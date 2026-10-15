package com.meridian.sam.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "setting_value")
public class SettingValue {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "settings_file_id")
    private SettingsFile settingsFile;
    @Column(name = "setting_group", nullable = false, length = 32)
    private String settingGroup;
    @Column(name = "ln_class", nullable = false, length = 8)
    private String lnClass;
    @Column(nullable = false, length = 64)
    private String name;
    @Column(name = "val", length = 64)
    private String value;
    @Column(length = 16)
    private String unit;
    @Column(name = "min_value", length = 32)
    private String minValue;
    @Column(name = "max_value", length = 32)
    private String maxValue;

    protected SettingValue() {}

    public SettingValue(SettingsFile file, String settingGroup, String lnClass, String name, String value,
                        String unit, String minValue, String maxValue) {
        this.settingsFile = file; this.settingGroup = settingGroup; this.lnClass = lnClass; this.name = name;
        this.value = value; this.unit = unit; this.minValue = minValue; this.maxValue = maxValue;
    }

    public Long getId() { return id; }
    public SettingsFile getSettingsFile() { return settingsFile; }
    public String getSettingGroup() { return settingGroup; }
    public String getLnClass() { return lnClass; }
    public String getName() { return name; }
    public String getValue() { return value; }
    public String getUnit() { return unit; }
    public String getMinValue() { return minValue; }
    public String getMaxValue() { return maxValue; }
}

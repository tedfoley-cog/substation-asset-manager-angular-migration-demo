package com.meridian.sam.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "ied")
public class Ied {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bay_id")
    private Bay bay;
    @Column(nullable = false, unique = true, length = 64)
    private String name;
    @Enumerated(EnumType.STRING) @Column(name = "device_type", nullable = false, length = 32)
    private DeviceType deviceType;
    @Column(nullable = false, length = 64)
    private String platform;
    @Column(nullable = false, length = 64)
    private String model;
    @Column(name = "serial_number", nullable = false, unique = true, length = 64)
    private String serialNumber;
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "firmware_version_id")
    private FirmwareVersion firmwareVersion;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32)
    private IedStatus status;
    @Column(name = "installed_on")
    private LocalDate installedOn;
    @Column(name = "last_settings_upload_at")
    private OffsetDateTime lastSettingsUploadAt;
    @Column(name = "last_seen_at")
    private OffsetDateTime lastSeenAt;

    public Long getId() { return id; }
    public Bay getBay() { return bay; }
    public String getName() { return name; }
    public DeviceType getDeviceType() { return deviceType; }
    public String getPlatform() { return platform; }
    public String getModel() { return model; }
    public String getSerialNumber() { return serialNumber; }
    public String getIpAddress() { return ipAddress; }
    public FirmwareVersion getFirmwareVersion() { return firmwareVersion; }
    public IedStatus getStatus() { return status; }
    public LocalDate getInstalledOn() { return installedOn; }
    public OffsetDateTime getLastSettingsUploadAt() { return lastSettingsUploadAt; }
    public OffsetDateTime getLastSeenAt() { return lastSeenAt; }

    public void setFirmwareVersion(FirmwareVersion firmwareVersion) { this.firmwareVersion = firmwareVersion; }
    public void setStatus(IedStatus status) { this.status = status; }
    public void setLastSettingsUploadAt(OffsetDateTime at) { this.lastSettingsUploadAt = at; }
}

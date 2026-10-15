package com.meridian.sam.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "scl_import_ied")
public class SclImportIed {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "scl_import_id")
    private SclImport sclImport;
    @Column(name = "ied_name", nullable = false, length = 64)
    private String iedName;
    @Column(length = 64)
    private String manufacturer;
    @Column(length = 64)
    private String type;
    @Column(name = "config_version", length = 32)
    private String configVersion;
    @Column(name = "access_point", length = 64)
    private String accessPoint;
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    @Column(name = "ln_classes", length = 512)
    private String lnClasses;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matched_ied_id")
    private Ied matchedIed;

    protected SclImportIed() {}

    public SclImportIed(SclImport sclImport, String iedName, String manufacturer, String type, String configVersion,
                        String accessPoint, String ipAddress, String lnClasses, Ied matchedIed) {
        this.sclImport = sclImport; this.iedName = iedName; this.manufacturer = manufacturer; this.type = type;
        this.configVersion = configVersion; this.accessPoint = accessPoint; this.ipAddress = ipAddress;
        this.lnClasses = lnClasses; this.matchedIed = matchedIed;
    }

    public Long getId() { return id; }
    public String getIedName() { return iedName; }
    public String getManufacturer() { return manufacturer; }
    public String getType() { return type; }
    public String getConfigVersion() { return configVersion; }
    public String getAccessPoint() { return accessPoint; }
    public String getIpAddress() { return ipAddress; }
    public String getLnClasses() { return lnClasses; }
    public Ied getMatchedIed() { return matchedIed; }
}

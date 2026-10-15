package com.meridian.sam.domain;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "settings_file")
public class SettingsFile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ied_id")
    private Ied ied;
    @Column(name = "version_no", nullable = false)
    private int versionNo;
    @Column(nullable = false)
    private String filename;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16)
    private SettingsStatus status;
    @Column(name = "uploaded_by", nullable = false, length = 64)
    private String uploadedBy;
    @Column(name = "uploaded_at", nullable = false)
    private OffsetDateTime uploadedAt;
    @Column(name = "checksum_sha256", nullable = false, length = 64)
    private String checksumSha256;
    @Column(length = 512)
    private String comment;
    @OneToMany(mappedBy = "settingsFile", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("settingGroup ASC, lnClass ASC, name ASC")
    private List<SettingValue> values = new ArrayList<>();

    protected SettingsFile() {}

    public SettingsFile(Ied ied, int versionNo, String filename, SettingsStatus status, String uploadedBy,
                        OffsetDateTime uploadedAt, String checksumSha256, String comment) {
        this.ied = ied; this.versionNo = versionNo; this.filename = filename; this.status = status;
        this.uploadedBy = uploadedBy; this.uploadedAt = uploadedAt; this.checksumSha256 = checksumSha256; this.comment = comment;
    }

    public Long getId() { return id; }
    public Ied getIed() { return ied; }
    public int getVersionNo() { return versionNo; }
    public String getFilename() { return filename; }
    public SettingsStatus getStatus() { return status; }
    public String getUploadedBy() { return uploadedBy; }
    public OffsetDateTime getUploadedAt() { return uploadedAt; }
    public String getChecksumSha256() { return checksumSha256; }
    public String getComment() { return comment; }
    public List<SettingValue> getValues() { return values; }
    public void setStatus(SettingsStatus status) { this.status = status; }
    public void addValue(SettingValue v) { values.add(v); }
}

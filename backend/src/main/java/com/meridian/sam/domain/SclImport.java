package com.meridian.sam.domain;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "scl_import")
public class SclImport {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String filename;
    @Enumerated(EnumType.STRING) @Column(name = "file_type", nullable = false, length = 8)
    private SclFileType fileType;
    @Column(name = "scl_version", length = 16)
    private String sclVersion;
    @Column(name = "substation_code", length = 16)
    private String substationCode;
    @Column(name = "ied_count", nullable = false)
    private int iedCount;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16)
    private SclImportStatus status;
    @Column(length = 1024)
    private String message;
    @Column(name = "imported_by", nullable = false, length = 64)
    private String importedBy;
    @Column(name = "imported_at", nullable = false)
    private OffsetDateTime importedAt;
    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "checksum_sha256", length = 64)
    private String checksumSha256;
    @OneToMany(mappedBy = "sclImport", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("iedName ASC")
    private List<SclImportIed> ieds = new ArrayList<>();

    protected SclImport() {}

    public SclImport(String filename, SclFileType fileType, String importedBy, OffsetDateTime importedAt, long sizeBytes) {
        this.filename = filename; this.fileType = fileType; this.importedBy = importedBy;
        this.importedAt = importedAt; this.sizeBytes = sizeBytes; this.status = SclImportStatus.PENDING;
    }

    public Long getId() { return id; }
    public String getFilename() { return filename; }
    public SclFileType getFileType() { return fileType; }
    public String getSclVersion() { return sclVersion; }
    public String getSubstationCode() { return substationCode; }
    public int getIedCount() { return iedCount; }
    public SclImportStatus getStatus() { return status; }
    public String getMessage() { return message; }
    public String getImportedBy() { return importedBy; }
    public OffsetDateTime getImportedAt() { return importedAt; }
    public long getSizeBytes() { return sizeBytes; }
    public List<SclImportIed> getIeds() { return ieds; }

    public void complete(String sclVersion, String substationCode, List<SclImportIed> parsed, String message) {
        this.sclVersion = sclVersion; this.substationCode = substationCode; this.ieds.clear(); this.ieds.addAll(parsed);
        this.iedCount = parsed.size(); this.status = SclImportStatus.COMPLETED; this.message = message;
    }
    public void fail(String message) {
        this.status = SclImportStatus.FAILED; this.message = message; this.iedCount = 0;
    }

    public String getChecksumSha256() { return checksumSha256; }
    public void setChecksumSha256(String checksumSha256) { this.checksumSha256 = checksumSha256; }
}

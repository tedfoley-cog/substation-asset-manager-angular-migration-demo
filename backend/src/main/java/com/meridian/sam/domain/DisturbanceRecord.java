package com.meridian.sam.domain;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "disturbance_record")
public class DisturbanceRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ied_id")
    private Ied ied;
    @Column(name = "record_id", nullable = false, unique = true, length = 64)
    private String recordId;
    @Column(name = "triggered_at", nullable = false)
    private OffsetDateTime triggeredAt;
    @Column(name = "trigger_source", nullable = false, length = 64)
    private String triggerSource;
    @Column(name = "fault_type", length = 16)
    private String faultType;
    @Column(name = "duration_ms", nullable = false)
    private int durationMs;
    @Column(name = "sample_rate_hz", nullable = false)
    private int sampleRateHz;
    @Column(name = "analog_channels", nullable = false)
    private int analogChannels;
    @Column(name = "digital_channels", nullable = false)
    private int digitalChannels;
    @Column(name = "file_format", nullable = false, length = 16)
    private String fileFormat;
    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;
    @Column(nullable = false)
    private boolean downloaded;
    @Column(name = "downloaded_by", length = 64)
    private String downloadedBy;
    @Column(name = "downloaded_at")
    private OffsetDateTime downloadedAt;

    public Long getId() { return id; }
    public Ied getIed() { return ied; }
    public String getRecordId() { return recordId; }
    public OffsetDateTime getTriggeredAt() { return triggeredAt; }
    public String getTriggerSource() { return triggerSource; }
    public String getFaultType() { return faultType; }
    public int getDurationMs() { return durationMs; }
    public int getSampleRateHz() { return sampleRateHz; }
    public int getAnalogChannels() { return analogChannels; }
    public int getDigitalChannels() { return digitalChannels; }
    public String getFileFormat() { return fileFormat; }
    public long getSizeBytes() { return sizeBytes; }
    public boolean isDownloaded() { return downloaded; }
    public String getDownloadedBy() { return downloadedBy; }
    public OffsetDateTime getDownloadedAt() { return downloadedAt; }

    public void markDownloaded(String by, OffsetDateTime at) { this.downloaded = true; this.downloadedBy = by; this.downloadedAt = at; }
}

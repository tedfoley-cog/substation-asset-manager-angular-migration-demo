package com.meridian.sam.domain;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "firmware_version")
public class FirmwareVersion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 64)
    private String platform;
    @Column(nullable = false, length = 32)
    private String version;
    @Column(name = "released_on", nullable = false)
    private LocalDate releasedOn;
    @Column(nullable = false)
    private boolean approved;
    @Column(name = "end_of_life", nullable = false)
    private boolean endOfLife;
    @Column(length = 1024)
    private String notes;

    public Long getId() { return id; }
    public String getPlatform() { return platform; }
    public String getVersion() { return version; }
    public LocalDate getReleasedOn() { return releasedOn; }
    public boolean isApproved() { return approved; }
    public boolean isEndOfLife() { return endOfLife; }
    public String getNotes() { return notes; }
}

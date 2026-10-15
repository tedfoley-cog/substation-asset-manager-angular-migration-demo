package com.meridian.sam.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "substation")
public class Substation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 16)
    private String code;
    @Column(nullable = false, length = 128)
    private String name;
    @Column(nullable = false, length = 64)
    private String region;
    @Column(name = "nominal_kv", nullable = false, precision = 6, scale = 1)
    private BigDecimal nominalKv;
    @Column(precision = 9, scale = 6)
    private BigDecimal latitude;
    @Column(precision = 9, scale = 6)
    private BigDecimal longitude;
    @Column(name = "commissioned_on")
    private LocalDate commissionedOn;
    @Column(name = "operator_notes", length = 1024)
    private String operatorNotes;
    @OneToMany(mappedBy = "substation")
    @OrderBy("name ASC")
    private Set<Bay> bays = new LinkedHashSet<>();

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getRegion() { return region; }
    public BigDecimal getNominalKv() { return nominalKv; }
    public BigDecimal getLatitude() { return latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public LocalDate getCommissionedOn() { return commissionedOn; }
    public String getOperatorNotes() { return operatorNotes; }
    public Set<Bay> getBays() { return bays; }
}

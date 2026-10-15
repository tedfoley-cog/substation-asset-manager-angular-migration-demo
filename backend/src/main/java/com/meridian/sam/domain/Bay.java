package com.meridian.sam.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "bay")
public class Bay {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "substation_id")
    private Substation substation;
    @Column(nullable = false, length = 64)
    private String name;
    @Enumerated(EnumType.STRING) @Column(name = "bay_type", nullable = false, length = 32)
    private BayType bayType;
    @Column(name = "nominal_kv", nullable = false, precision = 6, scale = 1)
    private BigDecimal nominalKv;
    @OneToMany(mappedBy = "bay")
    @OrderBy("name ASC")
    private Set<Ied> ieds = new LinkedHashSet<>();

    public Long getId() { return id; }
    public Substation getSubstation() { return substation; }
    public String getName() { return name; }
    public BayType getBayType() { return bayType; }
    public BigDecimal getNominalKv() { return nominalKv; }
    public Set<Ied> getIeds() { return ieds; }
}

package com.meridian.sam.service;

import com.meridian.sam.domain.Bay;
import com.meridian.sam.domain.Substation;
import com.meridian.sam.repository.BayRepository;
import com.meridian.sam.repository.IedRepository;
import com.meridian.sam.repository.SubstationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class SubstationService {
    private final SubstationRepository substations;
    private final BayRepository bays;
    private final IedRepository ieds;

    public SubstationService(SubstationRepository substations, BayRepository bays, IedRepository ieds) {
        this.substations = substations; this.bays = bays; this.ieds = ieds;
    }

    public List<Substation> list(String region) {
        return region == null || region.isBlank() ? substations.findAllByOrderByCodeAsc()
            : substations.findByRegionIgnoreCaseOrderByCodeAsc(region);
    }

    public Substation get(Long id) {
        return substations.findWithBaysById(id).orElseThrow(() -> new NotFoundException("Substation", id));
    }

    public List<Bay> baysOf(Long substationId) {
        get(substationId);
        return bays.findBySubstationIdOrderByNameAsc(substationId);
    }

    public long iedCount(Long substationId) { return ieds.countByBaySubstationId(substationId); }
}

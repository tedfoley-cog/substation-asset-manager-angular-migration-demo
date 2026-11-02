package com.meridian.sam.service;

import com.meridian.sam.domain.Bay;
import com.meridian.sam.domain.Substation;
import com.meridian.sam.repository.BayRepository;
import com.meridian.sam.repository.IedRepository;
import com.meridian.sam.repository.SubstationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
            : substations.findByRegionIgnoreCaseOrderByCodeAsc(region.trim());
    }

    public Substation get(Long id) {
        return substations.findWithBaysById(id).orElseThrow(() -> new NotFoundException("Substation", id));
    }

    public List<Bay> baysOf(Long substationId) {
        requireExists(substationId);
        return bays.findBySubstationIdOrderByNameAsc(substationId);
    }

    public long iedCount(Long substationId) {
        requireExists(substationId);
        return ieds.countByBaySubstationId(substationId);
    }

    /** IED counts for many substations in one aggregate query; substations without IEDs map to 0. */
    public Map<Long, Long> iedCounts(Collection<Long> substationIds) {
        Map<Long, Long> counts = new HashMap<>();
        if (substationIds.isEmpty()) return counts;
        substationIds.forEach(id -> counts.put(id, 0L));
        for (IedRepository.SubstationIedCount c : ieds.countBySubstationIds(substationIds)) {
            counts.put(c.getSubstationId(), c.getIedCount());
        }
        return counts;
    }

    private void requireExists(Long substationId) {
        if (!substations.existsById(substationId)) throw new NotFoundException("Substation", substationId);
    }
}

package com.meridian.sam.repository;

import com.meridian.sam.domain.Bay;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BayRepository extends JpaRepository<Bay, Long> {
    @EntityGraph(attributePaths = {"substation", "ieds"})
    List<Bay> findBySubstationIdOrderByNameAsc(Long substationId);
}

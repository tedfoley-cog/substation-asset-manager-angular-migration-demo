package com.meridian.sam.repository;

import com.meridian.sam.domain.Substation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubstationRepository extends JpaRepository<Substation, Long> {
    Optional<Substation> findByCode(String code);

    @EntityGraph(attributePaths = {"bays", "bays.ieds"})
    List<Substation> findAllByOrderByCodeAsc();

    @EntityGraph(attributePaths = {"bays", "bays.ieds"})
    List<Substation> findByRegionIgnoreCaseOrderByCodeAsc(String region);

    @EntityGraph(attributePaths = {"bays", "bays.ieds"})
    Optional<Substation> findWithBaysById(Long id);
}

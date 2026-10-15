package com.meridian.sam.repository;

import com.meridian.sam.domain.SclImport;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SclImportRepository extends JpaRepository<SclImport, Long> {
    List<SclImport> findAllByOrderByImportedAtDesc();

    @EntityGraph(attributePaths = {"ieds", "ieds.matchedIed"})
    Optional<SclImport> findWithIedsById(Long id);
}

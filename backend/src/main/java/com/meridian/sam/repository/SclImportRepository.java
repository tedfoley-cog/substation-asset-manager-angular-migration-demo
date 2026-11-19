package com.meridian.sam.repository;

import com.meridian.sam.domain.SclImport;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SclImportRepository extends JpaRepository<SclImport, Long> {
    List<SclImport> findAllByOrderByImportedAtDesc();

    @EntityGraph(attributePaths = {"ieds", "ieds.matchedIed"})
    Optional<SclImport> findWithIedsById(Long id);

    @Query("select i.iedName from SclImportIed i where i.matchedIed.id = :iedId order by i.id desc")
    List<String> matchedSclIedNames(@Param("iedId") Long iedId);

    /** Rows of {@code [iedId, sclIedName]}, newest match first, same ordering as {@link #matchedSclIedNames}. */
    @Query("select i.matchedIed.id, i.iedName from SclImportIed i where i.matchedIed.id in :iedIds order by i.id desc")
    List<Object[]> matchedSclIedNamesByIedIds(@Param("iedIds") Collection<Long> iedIds);
}

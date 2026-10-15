package com.meridian.sam.repository;

import com.meridian.sam.domain.DisturbanceRecord;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.util.List;

public interface DisturbanceRecordRepository extends JpaRepository<DisturbanceRecord, Long> {
    @EntityGraph(attributePaths = {"ied", "ied.bay", "ied.bay.substation"})
    @Query("""
        select r from DisturbanceRecord r
        where (:iedId is null or r.ied.id = :iedId)
          and (:substationId is null or r.ied.bay.substation.id = :substationId)
          and (:from is null or r.triggeredAt >= :from)
          and (:to is null or r.triggeredAt <= :to)
          and (:downloaded is null or r.downloaded = :downloaded)
        order by r.triggeredAt desc
        """)
    List<DisturbanceRecord> search(@Param("iedId") Long iedId, @Param("substationId") Long substationId,
                                   @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to,
                                   @Param("downloaded") Boolean downloaded);

    @EntityGraph(attributePaths = {"ied", "ied.bay", "ied.bay.substation"})
    java.util.Optional<DisturbanceRecord> findWithIedById(Long id);
}

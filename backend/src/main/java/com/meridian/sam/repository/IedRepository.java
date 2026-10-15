package com.meridian.sam.repository;

import com.meridian.sam.domain.Ied;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface IedRepository extends JpaRepository<Ied, Long> {
    Optional<Ied> findByName(String name);

    @EntityGraph(attributePaths = {"bay", "bay.substation", "firmwareVersion"})
    @Query("""
        select i from Ied i
        where (:substationId is null or i.bay.substation.id = :substationId)
          and (:deviceType is null or i.deviceType = :deviceType)
          and (:status is null or i.status = :status)
          and (:q is null or lower(i.name) like lower(concat('%', :q, '%'))
               or lower(i.serialNumber) like lower(concat('%', :q, '%'))
               or lower(i.model) like lower(concat('%', :q, '%')))
        order by i.name asc
        """)
    List<Ied> search(@Param("substationId") Long substationId,
                     @Param("deviceType") com.meridian.sam.domain.DeviceType deviceType,
                     @Param("status") com.meridian.sam.domain.IedStatus status,
                     @Param("q") String q);

    @EntityGraph(attributePaths = {"bay", "bay.substation", "firmwareVersion"})
    Optional<Ied> findWithDetailsById(Long id);

    long countByBaySubstationId(Long substationId);
}

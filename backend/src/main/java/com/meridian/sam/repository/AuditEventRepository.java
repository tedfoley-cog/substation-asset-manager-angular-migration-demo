package com.meridian.sam.repository;

import com.meridian.sam.domain.AuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.util.List;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {
    @Query("""
        select a from AuditEvent a
        where (:actor is null or lower(a.actor) = lower(:actor))
          and (:action is null or a.action = :action)
          and (:entityType is null or a.entityType = :entityType)
          and (:from is null or a.occurredAt >= :from)
          and (:to is null or a.occurredAt <= :to)
        order by a.occurredAt desc
        """)
    List<AuditEvent> search(@Param("actor") String actor, @Param("action") String action,
                            @Param("entityType") String entityType,
                            @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    @Query("select distinct a.action from AuditEvent a order by a.action")
    List<String> distinctActions();
}

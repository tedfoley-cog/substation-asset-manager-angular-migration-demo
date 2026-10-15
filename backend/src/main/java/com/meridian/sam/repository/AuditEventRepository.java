package com.meridian.sam.repository;

import com.meridian.sam.domain.AuditEvent;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long>, JpaSpecificationExecutor<AuditEvent> {

    default List<AuditEvent> search(String actor, String action, String entityType, OffsetDateTime from, OffsetDateTime to) {
        Specification<AuditEvent> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (actor != null) ps.add(cb.equal(cb.lower(root.get("actor")), actor.toLowerCase()));
            if (action != null) ps.add(cb.equal(root.get("action"), action));
            if (entityType != null) ps.add(cb.equal(root.get("entityType"), entityType));
            if (from != null) ps.add(cb.greaterThanOrEqualTo(root.get("occurredAt"), from));
            if (to != null) ps.add(cb.lessThanOrEqualTo(root.get("occurredAt"), to));
            return cb.and(ps.toArray(Predicate[]::new));
        };
        return findAll(spec, Sort.by(Sort.Direction.DESC, "occurredAt"));
    }

    @Query("select distinct a.action from AuditEvent a order by a.action")
    List<String> distinctActions();
}

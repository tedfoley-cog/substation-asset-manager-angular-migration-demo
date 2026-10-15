package com.meridian.sam.repository;

import com.meridian.sam.domain.DisturbanceRecord;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public interface DisturbanceRecordRepository extends JpaRepository<DisturbanceRecord, Long>, JpaSpecificationExecutor<DisturbanceRecord> {

    @EntityGraph(attributePaths = {"ied", "ied.bay", "ied.bay.substation"})
    List<DisturbanceRecord> findAll(Specification<DisturbanceRecord> spec, Sort sort);

    default List<DisturbanceRecord> search(Long iedId, Long substationId, OffsetDateTime from, OffsetDateTime to, Boolean downloaded) {
        Specification<DisturbanceRecord> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (iedId != null) ps.add(cb.equal(root.get("ied").get("id"), iedId));
            if (substationId != null) ps.add(cb.equal(root.get("ied").get("bay").get("substation").get("id"), substationId));
            if (from != null) ps.add(cb.greaterThanOrEqualTo(root.get("triggeredAt"), from));
            if (to != null) ps.add(cb.lessThanOrEqualTo(root.get("triggeredAt"), to));
            if (downloaded != null) ps.add(cb.equal(root.get("downloaded"), downloaded));
            return cb.and(ps.toArray(Predicate[]::new));
        };
        return findAll(spec, Sort.by(Sort.Direction.DESC, "triggeredAt"));
    }

    @EntityGraph(attributePaths = {"ied", "ied.bay", "ied.bay.substation"})
    Optional<DisturbanceRecord> findWithIedById(Long id);

    long countByIedId(Long iedId);
}

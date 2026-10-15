package com.meridian.sam.repository;

import com.meridian.sam.domain.DeviceType;
import com.meridian.sam.domain.Ied;
import com.meridian.sam.domain.IedStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public interface IedRepository extends JpaRepository<Ied, Long>, JpaSpecificationExecutor<Ied> {

    Optional<Ied> findByName(String name);

    /** Optional filters are composed as predicates: portable across H2 and PostgreSQL (no untyped null parameters). */
    @EntityGraph(attributePaths = {"bay", "bay.substation", "firmwareVersion"})
    List<Ied> findAll(Specification<Ied> spec, Sort sort);

    default List<Ied> search(Long substationId, DeviceType deviceType, IedStatus status, String q) {
        Specification<Ied> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (substationId != null) ps.add(cb.equal(root.get("bay").get("substation").get("id"), substationId));
            if (deviceType != null) ps.add(cb.equal(root.get("deviceType"), deviceType));
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase() + "%";
                ps.add(cb.or(cb.like(cb.lower(root.get("name")), like),
                             cb.like(cb.lower(root.get("serialNumber")), like),
                             cb.like(cb.lower(root.get("model")), like)));
            }
            return cb.and(ps.toArray(Predicate[]::new));
        };
        return findAll(spec, Sort.by(Sort.Direction.ASC, "name"));
    }

    @EntityGraph(attributePaths = {"bay", "bay.substation", "firmwareVersion"})
    Optional<Ied> findWithDetailsById(Long id);

    long countByBaySubstationId(Long substationId);
}

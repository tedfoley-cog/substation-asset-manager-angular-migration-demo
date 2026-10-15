package com.meridian.sam.audit;

import com.meridian.sam.domain.AuditEvent;
import com.meridian.sam.repository.AuditEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.OffsetDateTime;

/**
 * Append-only audit trail. Written in its own transaction so a DENIED or FAILURE outcome is kept even
 * when the business transaction rolls back.
 */
@Service
public class AuditService {
    private final AuditEventRepository repository;
    private final Clock clock;

    public AuditService(AuditEventRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditEvent record(String actor, String action, String entityType, String entityId,
                             String outcome, String details, String clientIp) {
        return repository.save(new AuditEvent(OffsetDateTime.now(clock), actor, action, entityType, entityId,
            outcome, details, clientIp));
    }
}

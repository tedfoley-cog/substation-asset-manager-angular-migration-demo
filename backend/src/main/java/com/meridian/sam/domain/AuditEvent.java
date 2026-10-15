package com.meridian.sam.domain;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "audit_event")
public class AuditEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "occurred_at", nullable = false)
    private OffsetDateTime occurredAt;
    @Column(nullable = false, length = 64)
    private String actor;
    @Column(nullable = false, length = 64)
    private String action;
    @Column(name = "entity_type", nullable = false, length = 32)
    private String entityType;
    @Column(name = "entity_id", length = 64)
    private String entityId;
    @Column(nullable = false, length = 16)
    private String outcome;
    @Column(length = 2048)
    private String details;
    @Column(name = "client_ip", length = 45)
    private String clientIp;

    protected AuditEvent() {}

    public AuditEvent(OffsetDateTime occurredAt, String actor, String action, String entityType, String entityId,
                      String outcome, String details, String clientIp) {
        this.occurredAt = occurredAt; this.actor = actor; this.action = action; this.entityType = entityType;
        this.entityId = entityId; this.outcome = outcome; this.details = details; this.clientIp = clientIp;
    }

    public Long getId() { return id; }
    public OffsetDateTime getOccurredAt() { return occurredAt; }
    public String getActor() { return actor; }
    public String getAction() { return action; }
    public String getEntityType() { return entityType; }
    public String getEntityId() { return entityId; }
    public String getOutcome() { return outcome; }
    public String getDetails() { return details; }
    public String getClientIp() { return clientIp; }
}

package com.meridian.sam.service;

import com.meridian.sam.auth.CurrentUser;
import com.meridian.sam.auth.Permissions;
import com.meridian.sam.domain.AuditEvent;
import com.meridian.sam.domain.Role;
import com.meridian.sam.repository.AuditEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AuditQueryService {
    private final AuditEventRepository events;
    public AuditQueryService(AuditEventRepository events) { this.events = events; }

    public List<AuditEvent> search(CurrentUser user, String actor, String action, String entityType, OffsetDateTime from, OffsetDateTime to) {
        Permissions.require(user, Role::canReadAudit, "read the audit trail");
        return events.search(blankToNull(actor), blankToNull(action), blankToNull(entityType), from, to);
    }

    public List<String> actions() { return events.distinctActions(); }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }
}

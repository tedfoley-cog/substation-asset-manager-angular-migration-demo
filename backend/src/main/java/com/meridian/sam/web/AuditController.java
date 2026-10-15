package com.meridian.sam.web;

import com.meridian.sam.auth.CurrentUser;
import com.meridian.sam.service.AuditQueryService;
import com.meridian.sam.web.dto.AuditEventDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/audit")
@Tag(name = "Audit trail")
public class AuditController {
    private final AuditQueryService service;
    public AuditController(AuditQueryService service) { this.service = service; }

    @GetMapping
    @Operation(summary = "Audit events, newest first (AUDITOR or PROTECTION_ADMIN)")
    public List<AuditEventDto> search(@RequestParam(required = false) String actor,
                                      @RequestParam(required = false) String action,
                                      @RequestParam(required = false) String entityType,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
                                      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
                                      CurrentUser user) {
        return service.search(user, actor, action, entityType, from, to).stream().map(DtoMapper::audit).toList();
    }

    @GetMapping("/actions")
    @Operation(summary = "Distinct audit action codes")
    public List<String> actions() { return service.actions(); }
}

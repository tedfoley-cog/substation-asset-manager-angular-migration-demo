package com.meridian.sam.web;

import com.meridian.sam.auth.CurrentUser;
import com.meridian.sam.service.RecordService;
import com.meridian.sam.web.dto.DisturbanceRecordDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/records")
@Tag(name = "Disturbance records")
public class RecordController {
    private final RecordService service;
    public RecordController(RecordService service) { this.service = service; }

    @GetMapping
    @Operation(summary = "Disturbance records available for download, newest first")
    public List<DisturbanceRecordDto> search(@RequestParam(required = false) Long iedId,
                                             @RequestParam(required = false) Long substationId,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
                                             @RequestParam(required = false) Boolean downloaded) {
        return service.search(iedId, substationId, from, to, downloaded).stream().map(DtoMapper::record).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Disturbance record detail")
    public DisturbanceRecordDto get(@PathVariable Long id) { return DtoMapper.record(service.get(id)); }

    @PostMapping("/{id}/download")
    @Operation(summary = "Retrieve the record; returns the COMTRADE .cfg and marks the record downloaded")
    public ResponseEntity<String> download(@PathVariable Long id, CurrentUser user, HttpServletRequest request) {
        String cfg = service.download(id, user, request.getRemoteAddr());
        String name = service.get(id).getRecordId() + ".cfg";
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + name + "\"")
            .contentType(MediaType.TEXT_PLAIN)
            .body(cfg);
    }
}

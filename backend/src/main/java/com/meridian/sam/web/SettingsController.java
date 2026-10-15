package com.meridian.sam.web;

import com.meridian.sam.auth.CurrentUser;
import com.meridian.sam.service.SettingsService;
import com.meridian.sam.web.dto.SettingsFileDto;
import com.meridian.sam.service.SettingsUploadRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Settings files")
public class SettingsController {
    private final SettingsService service;
    public SettingsController(SettingsService service) { this.service = service; }

    @GetMapping("/ieds/{iedId}/settings")
    @Operation(summary = "Settings-file history of an IED, newest first (no values)")
    public List<SettingsFileDto> history(@PathVariable Long iedId) {
        return service.history(iedId).stream().map(f -> DtoMapper.settingsFile(f, false)).toList();
    }

    @GetMapping("/settings/{fileId}")
    @Operation(summary = "Settings file with every setting value")
    public SettingsFileDto get(@PathVariable Long fileId) {
        return DtoMapper.settingsFile(service.get(fileId), true);
    }

    @PostMapping("/ieds/{iedId}/settings")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload a new settings-file version (ENGINEER or PROTECTION_ADMIN)")
    public SettingsFileDto upload(@PathVariable Long iedId, @Valid @RequestBody SettingsUploadRequest body,
                                  CurrentUser user, HttpServletRequest request) {
        return DtoMapper.settingsFile(service.upload(iedId, body, user, request.getRemoteAddr()), true);
    }
}

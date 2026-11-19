package com.meridian.sam.web;

import com.meridian.sam.auth.CurrentUser;
import com.meridian.sam.domain.DeviceType;
import com.meridian.sam.domain.IedStatus;
import com.meridian.sam.domain.Ied;
import com.meridian.sam.service.IedService;
import com.meridian.sam.service.IedStats;
import com.meridian.sam.web.dto.FirmwareAssignmentRequest;
import com.meridian.sam.web.dto.FirmwareDto;
import com.meridian.sam.web.dto.IedDto;
import com.meridian.sam.web.dto.StatusChangeRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "IEDs")
public class IedController {
    private final IedService service;
    public IedController(IedService service) { this.service = service; }

    @GetMapping("/ieds")
    @Operation(summary = "Search IEDs by substation, device type, status or free text (name, serial, model)")
    public List<IedDto> search(@RequestParam(required = false) Long substationId,
                               @RequestParam(required = false) DeviceType deviceType,
                               @RequestParam(required = false) IedStatus status,
                               @RequestParam(required = false) String q) {
        List<Ied> ieds = service.search(substationId, deviceType, status, q);
        Map<Long, IedStats> stats = service.stats(ieds.stream().map(Ied::getId).toList());
        return ieds.stream().map(i -> DtoMapper.ied(i, stats.get(i.getId()))).toList();
    }

    @GetMapping("/ieds/{id}")
    @Operation(summary = "IED detail")
    public IedDto get(@PathVariable Long id) { return toDto(service.get(id)); }

    @PutMapping("/ieds/{id}/firmware")
    @Operation(summary = "Assign a firmware version (PROTECTION_ADMIN only)")
    public IedDto assignFirmware(@PathVariable Long id, @Valid @RequestBody FirmwareAssignmentRequest body,
                                 CurrentUser user, HttpServletRequest request) {
        return toDto(service.assignFirmware(id, body.firmwareVersionId(), user, request.getRemoteAddr()));
    }

    @PutMapping("/ieds/{id}/status")
    @Operation(summary = "Change IED lifecycle status")
    public IedDto changeStatus(@PathVariable Long id, @Valid @RequestBody StatusChangeRequest body,
                               CurrentUser user, HttpServletRequest request) {
        return toDto(service.changeStatus(id, body.status(), user, request.getRemoteAddr()));
    }

    @GetMapping("/firmware")
    @Operation(summary = "Firmware catalogue, optionally filtered by platform")
    public List<FirmwareDto> firmware(@RequestParam(required = false) String platform) {
        return service.firmwareCatalogue(platform).stream().map(DtoMapper::firmware).toList();
    }

    private IedDto toDto(Ied ied) { return DtoMapper.ied(ied, service.stats(ied)); }
}

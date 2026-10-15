package com.meridian.sam.web;

import com.meridian.sam.service.SubstationService;
import com.meridian.sam.web.dto.BayDto;
import com.meridian.sam.web.dto.SubstationDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/substations")
@Tag(name = "Substations")
public class SubstationController {
    private final SubstationService service;
    public SubstationController(SubstationService service) { this.service = service; }

    @GetMapping
    @Operation(summary = "List substations, optionally filtered by region")
    public List<SubstationDto> list(@RequestParam(required = false) String region) {
        return service.list(region).stream().map(s -> DtoMapper.substation(s, service.iedCount(s.getId()), false)).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Substation detail including bays")
    public SubstationDto get(@PathVariable Long id) {
        return DtoMapper.substation(service.get(id), service.iedCount(id), true);
    }

    @GetMapping("/{id}/bays")
    @Operation(summary = "Bays of a substation")
    public List<BayDto> bays(@PathVariable Long id) {
        return service.baysOf(id).stream().map(DtoMapper::bay).toList();
    }
}

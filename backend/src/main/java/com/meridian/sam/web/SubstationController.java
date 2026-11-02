package com.meridian.sam.web;

import com.meridian.sam.domain.Substation;
import com.meridian.sam.service.SubstationService;
import com.meridian.sam.web.dto.BayDto;
import com.meridian.sam.web.dto.SubstationDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/substations")
@Tag(name = "Substations")
public class SubstationController {
    private final SubstationService service;
    public SubstationController(SubstationService service) { this.service = service; }

    @GetMapping
    @Operation(summary = "List substations, optionally filtered by region")
    public List<SubstationDto> list(@RequestParam(required = false) String region) {
        List<Substation> list = service.list(region);
        Map<Long, Long> iedCounts = service.iedCounts(list.stream().map(Substation::getId).toList());
        return list.stream().map(s -> DtoMapper.substation(s, iedCounts.get(s.getId()), false)).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Substation detail including bays")
    public SubstationDto get(@PathVariable Long id) {
        Substation substation = service.get(id);
        return DtoMapper.substation(substation, service.iedCount(id), true);
    }

    @GetMapping("/{id}/bays")
    @Operation(summary = "Bays of a substation")
    public List<BayDto> bays(@PathVariable Long id) {
        return service.baysOf(id).stream().map(DtoMapper::bay).toList();
    }
}

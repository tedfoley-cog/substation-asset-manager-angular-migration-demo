package com.meridian.sam.web;

import com.meridian.sam.auth.CurrentUser;
import com.meridian.sam.scl.SclImportService;
import com.meridian.sam.web.dto.SclImportDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/scl")
@Tag(name = "SCL import")
public class SclImportController {
    private final SclImportService service;
    public SclImportController(SclImportService service) { this.service = service; }

    @GetMapping("/imports")
    @Operation(summary = "Import history, newest first")
    public List<SclImportDto> list() {
        return service.list().stream().map(i -> DtoMapper.sclImport(i, false)).toList();
    }

    @GetMapping("/imports/{id}")
    @Operation(summary = "Import detail including the IEDs found in the file")
    public SclImportDto get(@PathVariable Long id) { return DtoMapper.sclImport(service.get(id), true); }

    @PostMapping(value = "/imports", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload and parse an IEC 61850 SCL file (.icd/.cid/.scd)")
    public SclImportDto upload(@RequestPart("file") MultipartFile file, CurrentUser user, HttpServletRequest request) {
        return DtoMapper.sclImport(service.importFile(file, user, request.getRemoteAddr()), true);
    }
}

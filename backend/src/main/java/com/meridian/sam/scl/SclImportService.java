package com.meridian.sam.scl;

import com.meridian.sam.audit.AuditService;
import com.meridian.sam.auth.AccessDeniedException;
import com.meridian.sam.auth.CurrentUser;
import com.meridian.sam.auth.Permissions;
import com.meridian.sam.domain.*;
import com.meridian.sam.repository.IedRepository;
import com.meridian.sam.repository.SclImportRepository;
import com.meridian.sam.service.NotFoundException;
import com.meridian.sam.service.ValidationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class SclImportService {
    private final SclImportRepository imports;
    private final IedRepository ieds;
    private final AuditService audit;
    private final Clock clock;
    private final SclParser parser = new SclParser();

    public SclImportService(SclImportRepository imports, IedRepository ieds, AuditService audit, Clock clock) {
        this.imports = imports; this.ieds = ieds; this.audit = audit; this.clock = clock;
    }

    public List<SclImport> list() { return imports.findAllByOrderByImportedAtDesc(); }

    public SclImport get(Long id) {
        return imports.findWithIedsById(id).orElseThrow(() -> new NotFoundException("SCL import", id));
    }

    @Transactional
    public SclImport importFile(MultipartFile file, CurrentUser user, String clientIp) {
        String filename = file.getOriginalFilename() == null ? "upload.scd" : file.getOriginalFilename();
        try {
            Permissions.require(user, Role::canImportScl, "import SCL files");
            SclFileType type = fileType(filename);
            SclImport imp = new SclImport(filename, type, user.username(), OffsetDateTime.now(clock), file.getSize());
            imp.setChecksumSha256(sha256Hex(file.getBytes()));
            try (InputStream in = file.getInputStream()) {
                SclDocument doc = parser.parse(in);
                List<SclImportIed> parsed = new ArrayList<>();
                int matched = 0;
                for (SclDocument.SclIed s : doc.ieds()) {
                    Ied match = ieds.findByName(s.name()).orElse(null);
                    if (match != null) matched++;
                    parsed.add(new SclImportIed(imp, s.name(), s.manufacturer(), s.type(), s.configVersion(), s.accessPoint(),
                        s.ipAddress(), String.join(",", s.lnClasses()), match));
                }
                String sclVersion = doc.version() == null ? null : doc.version() + (doc.revision() == null ? "" : doc.revision());
                StringBuilder msg = new StringBuilder(matched + " of " + parsed.size() + " IEDs matched to inventory.");
                doc.warnings().forEach(w -> msg.append(' ').append(w).append('.'));
                imp.complete(sclVersion, doc.substationName(), parsed, msg.toString());
                SclImport saved = imports.save(imp);
                audit.record(user.username(), "SCL_IMPORT", "SCL_IMPORT", String.valueOf(saved.getId()), "SUCCESS",
                    filename + " imported, " + matched + "/" + parsed.size() + " IEDs matched", clientIp);
                return saved;
            } catch (SclParseException e) {
                imp.fail(e.getMessage());
                SclImport saved = imports.save(imp);
                audit.record(user.username(), "SCL_IMPORT", "SCL_IMPORT", String.valueOf(saved.getId()), "FAILURE",
                    filename + " rejected: " + e.getMessage(), clientIp);
                return saved;
            }
        } catch (IOException e) {
            audit.record(user.username(), "SCL_IMPORT", "SCL_IMPORT", null, "FAILURE", filename + ": " + e.getMessage(), clientIp);
            throw new ValidationException(List.of("Could not read uploaded file: " + e.getMessage()));
        } catch (AccessDeniedException e) {
            audit.record(user.username(), "SCL_IMPORT", "SCL_IMPORT", null, "DENIED", e.getMessage(), clientIp);
            throw e;
        }
    }

    static SclFileType fileType(String filename) {
        int dot = filename.lastIndexOf('.');
        String ext = dot < 0 ? "" : filename.substring(dot + 1).toUpperCase(Locale.ROOT);
        try {
            return SclFileType.valueOf(ext);
        } catch (IllegalArgumentException e) {
            throw new ValidationException(List.of("Unsupported SCL file extension ." + ext.toLowerCase(Locale.ROOT) + " (expected .icd, .cid, .scd, .ssd or .iid)"));
        }
    }

    private static String sha256Hex(byte[] bytes) {
        try {
            return java.util.HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}

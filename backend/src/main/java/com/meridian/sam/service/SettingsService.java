package com.meridian.sam.service;

import com.meridian.sam.audit.AuditService;
import com.meridian.sam.auth.AccessDeniedException;
import com.meridian.sam.auth.CurrentUser;
import com.meridian.sam.auth.Permissions;
import com.meridian.sam.domain.*;
import com.meridian.sam.repository.IedRepository;
import com.meridian.sam.repository.SettingsFileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class SettingsService {
    private final SettingsFileRepository files;
    private final IedRepository ieds;
    private final AuditService audit;
    private final Clock clock;

    public SettingsService(SettingsFileRepository files, IedRepository ieds, AuditService audit, Clock clock) {
        this.files = files; this.ieds = ieds; this.audit = audit; this.clock = clock;
    }

    public List<SettingsFile> history(Long iedId) {
        ieds.findById(iedId).orElseThrow(() -> new NotFoundException("IED", iedId));
        return files.findByIedIdOrderByVersionNoDesc(iedId);
    }

    public SettingsFile get(Long fileId) {
        return files.findWithValuesById(fileId).orElseThrow(() -> new NotFoundException("Settings file", fileId));
    }

    @Transactional
    public SettingsFile upload(Long iedId, SettingsUploadRequest request, CurrentUser user, String clientIp) {
        Ied ied = ieds.findById(iedId).orElseThrow(() -> new NotFoundException("IED", iedId));
        try {
            Permissions.require(user, Role::canUploadSettings, "upload settings");
            List<String> violations = validate(request);
            if (!violations.isEmpty()) {
                throw new ValidationException(violations);
            }
            int next = files.findFirstByIedIdOrderByVersionNoDesc(iedId).map(f -> f.getVersionNo() + 1).orElse(1);
            SettingsStatus status = request.draft() ? SettingsStatus.DRAFT : SettingsStatus.ACTIVE;
            if (status == SettingsStatus.ACTIVE) {
                files.findByIedIdOrderByVersionNoDesc(iedId).stream()
                    .filter(f -> f.getStatus() == SettingsStatus.ACTIVE)
                    .forEach(f -> f.setStatus(SettingsStatus.SUPERSEDED));
            }
            String filename = ied.getName() + "_v" + String.format("%03d", next) + ".rsf";
            SettingsFile file = new SettingsFile(ied, next, filename, status, user.username(), OffsetDateTime.now(clock),
                checksum(request), request.comment());
            for (SettingsUploadRequest.Value v : request.values()) {
                file.addValue(new SettingValue(file, v.settingGroup(), v.lnClass(), v.name(), v.value(), v.unit(), v.minValue(), v.maxValue()));
            }
            SettingsFile saved = files.save(file);
            ied.setLastSettingsUploadAt(saved.getUploadedAt());
            audit.record(user.username(), "SETTINGS_UPLOAD", "IED", ied.getName(), "SUCCESS",
                "Uploaded " + filename + (request.draft() ? " as DRAFT" : ""), clientIp);
            return saved;
        } catch (RuntimeException e) {
            audit.record(user.username(), "SETTINGS_UPLOAD", "IED", ied.getName(),
                e instanceof AccessDeniedException ? "DENIED" : "FAILURE", e.getMessage(), clientIp);
            throw e;
        }
    }

    List<String> validate(SettingsUploadRequest request) {
        List<String> violations = new ArrayList<>();
        if (request.values() == null || request.values().isEmpty()) {
            violations.add("At least one setting value is required");
            return violations;
        }
        for (SettingsUploadRequest.Value v : request.values()) {
            if (v.name() == null || v.name().isBlank()) {
                violations.add("Setting name is required");
                continue;
            }
            if (v.value() == null || v.value().isBlank()) {
                violations.add(v.name() + ": value is required (blank is not zero)");
                continue;
            }
            BigDecimal num = parse(v.value());
            if (num == null) continue; // enumerated settings such as curve names are free text
            BigDecimal min = parse(v.minValue());
            BigDecimal max = parse(v.maxValue());
            if (min != null && num.compareTo(min) < 0) violations.add(v.name() + ": " + v.value() + " is below minimum " + v.minValue());
            if (max != null && num.compareTo(max) > 0) violations.add(v.name() + ": " + v.value() + " exceeds maximum " + v.maxValue());
        }
        return violations;
    }

    static BigDecimal parse(String s) {
        if (s == null || s.isBlank()) return null;
        try { return new BigDecimal(s.trim()); } catch (NumberFormatException e) { return null; }
    }

    private static String checksum(SettingsUploadRequest request) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            request.values().forEach(v -> md.update((v.settingGroup() + "|" + v.name() + "|" + v.value() + "\n").getBytes(StandardCharsets.UTF_8)));
            return HexFormat.of().formatHex(md.digest());
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}

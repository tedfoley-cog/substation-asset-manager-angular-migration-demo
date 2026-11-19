package com.meridian.sam.service;

import com.meridian.sam.audit.AuditService;
import com.meridian.sam.auth.CurrentUser;
import com.meridian.sam.auth.Permissions;
import com.meridian.sam.domain.*;
import com.meridian.sam.repository.FirmwareVersionRepository;
import com.meridian.sam.repository.IedRepository;
import com.meridian.sam.repository.SclImportRepository;
import com.meridian.sam.repository.DisturbanceRecordRepository;
import com.meridian.sam.repository.SettingsFileRepository;
import com.meridian.sam.domain.SettingsStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class IedService {
    private final IedRepository ieds;
    private final FirmwareVersionRepository firmware;
    private final SettingsFileRepository settingsFiles;
    private final DisturbanceRecordRepository records;
    private final SclImportRepository sclImports;
    private final AuditService audit;

    public IedService(IedRepository ieds, FirmwareVersionRepository firmware, SettingsFileRepository settingsFiles,
                      DisturbanceRecordRepository records, SclImportRepository sclImports, AuditService audit) {
        this.ieds = ieds; this.firmware = firmware; this.settingsFiles = settingsFiles; this.records = records;
        this.sclImports = sclImports; this.audit = audit;
    }

    /** Summary figures for one IED. */
    public IedStats stats(Ied ied) {
        return stats(List.of(ied.getId())).get(ied.getId());
    }

    /** Summary figures for many IEDs in four queries total, keyed by IED id in the order given. */
    public Map<Long, IedStats> stats(Collection<Long> iedIds) {
        Map<Long, IedStats> out = new LinkedHashMap<>();
        if (iedIds.isEmpty()) return out;
        Map<Long, Integer> active = firstPerIed(settingsFiles.versionNosByIedIdsAndStatus(iedIds, SettingsStatus.ACTIVE));
        Map<Long, Long> fileCounts = firstPerIed(settingsFiles.countByIedIds(iedIds));
        Map<Long, Long> recordCounts = firstPerIed(records.countByIedIds(iedIds));
        Map<Long, String> sclNames = firstPerIed(sclImports.matchedSclIedNamesByIedIds(iedIds));
        for (Long id : iedIds) {
            out.put(id, new IedStats(active.get(id), fileCounts.getOrDefault(id, 0L), recordCounts.getOrDefault(id, 0L), sclNames.get(id)));
        }
        return out;
    }

    /** Maps {@code [iedId, value]} rows to iedId -> value, keeping the first row seen per IED. */
    @SuppressWarnings("unchecked")
    private static <V> Map<Long, V> firstPerIed(List<Object[]> rows) {
        Map<Long, V> m = new HashMap<>();
        for (Object[] row : rows) m.putIfAbsent((Long) row[0], (V) row[1]);
        return m;
    }

    public List<Ied> search(Long substationId, DeviceType deviceType, IedStatus status, String q) {
        return ieds.search(substationId, deviceType, status, q == null || q.isBlank() ? null : q.trim());
    }

    public Ied get(Long id) {
        return ieds.findWithDetailsById(id).orElseThrow(() -> new NotFoundException("IED", id));
    }

    public List<FirmwareVersion> firmwareCatalogue(String platform) {
        return platform == null || platform.isBlank() ? firmware.findAllByOrderByPlatformAscReleasedOnDesc()
            : firmware.findByPlatformOrderByReleasedOnDesc(platform);
    }

    @Transactional
    public Ied assignFirmware(Long iedId, Long firmwareId, CurrentUser user, String clientIp) {
        Ied ied = get(iedId);
        try {
            Permissions.require(user, Role::canAssignFirmware, "assign firmware");
            FirmwareVersion fw = firmware.findById(firmwareId).orElseThrow(() -> new NotFoundException("Firmware", firmwareId));
            if (!fw.getPlatform().equals(ied.getPlatform())) {
                throw new ValidationException(List.of("Firmware platform " + fw.getPlatform() + " does not match IED platform " + ied.getPlatform()));
            }
            if (fw.isEndOfLife()) {
                throw new ValidationException(List.of("Firmware " + fw.getVersion() + " is end-of-life and cannot be assigned"));
            }
            ied.setFirmwareVersion(fw);
            audit.record(user.username(), "FIRMWARE_ASSIGN", "IED", ied.getName(), "SUCCESS",
                "Firmware set to " + fw.getPlatform() + " " + fw.getVersion() + (fw.isApproved() ? "" : " (unapproved)"), clientIp);
            return ied;
        } catch (RuntimeException e) {
            audit.record(user.username(), "FIRMWARE_ASSIGN", "IED", ied.getName(),
                e instanceof com.meridian.sam.auth.AccessDeniedException ? "DENIED" : "FAILURE", e.getMessage(), clientIp);
            throw e;
        }
    }

    @Transactional
    public Ied changeStatus(Long iedId, IedStatus status, CurrentUser user, String clientIp) {
        Ied ied = get(iedId);
        Permissions.require(user, r -> r == Role.PROTECTION_ADMIN || r == Role.ENGINEER, "change IED status");
        IedStatus before = ied.getStatus();
        ied.setStatus(status);
        audit.record(user.username(), "IED_STATUS_CHANGE", "IED", ied.getName(), "SUCCESS", before + " -> " + status, clientIp);
        return ied;
    }
}

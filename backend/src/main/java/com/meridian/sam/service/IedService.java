package com.meridian.sam.service;

import com.meridian.sam.audit.AuditService;
import com.meridian.sam.auth.CurrentUser;
import com.meridian.sam.auth.Permissions;
import com.meridian.sam.domain.*;
import com.meridian.sam.repository.FirmwareVersionRepository;
import com.meridian.sam.repository.IedRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class IedService {
    private final IedRepository ieds;
    private final FirmwareVersionRepository firmware;
    private final AuditService audit;

    public IedService(IedRepository ieds, FirmwareVersionRepository firmware, AuditService audit) {
        this.ieds = ieds; this.firmware = firmware; this.audit = audit;
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

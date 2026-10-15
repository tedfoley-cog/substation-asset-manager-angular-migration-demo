package com.meridian.sam.web;

import com.meridian.sam.service.IedStats;

import com.meridian.sam.auth.CurrentUser;
import com.meridian.sam.domain.*;
import com.meridian.sam.web.dto.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

final class DtoMapper {
    private DtoMapper() {}

    static SubstationDto substation(Substation s, long iedCount, boolean withBays) {
        List<BayDto> bays = withBays ? s.getBays().stream().map(DtoMapper::bay).toList() : null;
        return new SubstationDto(s.getId(), s.getCode(), s.getName(), s.getRegion(), s.getNominalKv(), s.getLatitude(),
            s.getLongitude(), s.getCommissionedOn(), s.getOperatorNotes(), s.getBays().size(), iedCount, bays);
    }

    static BayDto bay(Bay b) {
        return new BayDto(b.getId(), b.getSubstation().getId(), b.getName(), b.getBayType().name(), b.getNominalKv(), b.getIeds().size());
    }

    static IedDto ied(Ied i, IedStats st) {
        Bay b = i.getBay();
        Substation s = b.getSubstation();
        return new IedDto(i.getId(), i.getName(), i.getDeviceType().name(), i.getPlatform(), i.getModel(), i.getSerialNumber(),
            i.getIpAddress(), i.getStatus().name(), i.getInstalledOn(), i.getLastSettingsUploadAt(), i.getLastSeenAt(),
            s.getId(), s.getCode(), s.getName(), b.getId(), b.getName(),
            i.getFirmwareVersion() == null ? null : firmware(i.getFirmwareVersion()),
            st.activeSettingsVersion(), st.settingsFileCount(), st.recordCount(), st.sclIedName());
    }

    static FirmwareDto firmware(FirmwareVersion f) {
        return new FirmwareDto(f.getId(), f.getPlatform(), f.getVersion(), f.getReleasedOn(), f.isApproved(), f.isEndOfLife(), f.getNotes());
    }

    static SettingsFileDto settingsFile(SettingsFile f, boolean withValues) {
        List<SettingValueDto> values = withValues ? f.getValues().stream().map(DtoMapper::settingValue).toList() : null;
        return new SettingsFileDto(f.getId(), f.getIed().getId(), f.getIed().getName(), f.getVersionNo(), f.getFilename(),
            f.getStatus().name(), f.getUploadedBy(), f.getUploadedAt(), f.getChecksumSha256(), f.getComment(),
            withValues ? f.getValues().size() : null, values);
    }

    static SettingValueDto settingValue(SettingValue v) {
        return new SettingValueDto(v.getSettingGroup(), v.getLnClass(), v.getName(), v.getValue(), v.getUnit(), v.getMinValue(), v.getMaxValue());
    }

    static SclImportDto sclImport(SclImport i, boolean withIeds) {
        List<SclImportIedDto> ieds = withIeds ? i.getIeds().stream().map(DtoMapper::sclImportIed).toList() : null;
        return new SclImportDto(i.getId(), i.getFilename(), i.getFileType().name(), i.getSclVersion(), i.getSubstationCode(),
            i.getIedCount(), i.getStatus().name(), i.getMessage(), i.getImportedBy(), i.getImportedAt(), i.getSizeBytes(),
            i.getChecksumSha256(), ieds);
    }

    static SclImportIedDto sclImportIed(SclImportIed i) {
        List<String> ln = i.getLnClasses() == null || i.getLnClasses().isBlank() ? List.of() : Arrays.asList(i.getLnClasses().split(","));
        return new SclImportIedDto(i.getIedName(), i.getManufacturer(), i.getType(), i.getConfigVersion(), i.getAccessPoint(),
            i.getIpAddress(), ln, i.getMatchedIed() == null ? null : i.getMatchedIed().getId(),
            i.getMatchedIed() == null ? null : i.getMatchedIed().getName());
    }

    static DisturbanceRecordDto record(DisturbanceRecord r) {
        return new DisturbanceRecordDto(r.getId(), r.getRecordId(), r.getIed().getId(), r.getIed().getName(),
            r.getIed().getBay().getSubstation().getCode(), r.getTriggeredAt(), r.getTriggerSource(), r.getFaultType(),
            r.getDurationMs(), r.getSampleRateHz(), r.getAnalogChannels(), r.getDigitalChannels(), r.getFileFormat(),
            r.getSizeBytes(), r.isDownloaded(), r.getDownloadedBy(), r.getDownloadedAt());
    }

    static UserDto user(AppUser u) {
        return new UserDto(u.getId(), u.getUsername(), u.getDisplayName(), u.getRole().name(), u.getLocale(), u.isActive());
    }

    static CurrentUserDto currentUser(CurrentUser u) {
        List<String> perms = new ArrayList<>();
        if (u.role().canUploadSettings()) perms.add("settings:upload");
        if (u.role().canImportScl()) perms.add("scl:import");
        if (u.role().canAssignFirmware()) perms.add("firmware:assign");
        if (u.role().canDownloadRecords()) perms.add("records:download");
        if (u.role().canReadAudit()) perms.add("audit:read");
        return new CurrentUserDto(u.username(), u.displayName(), u.role().name(), u.locale(), u.authenticated(), perms);
    }

    static AuditEventDto audit(AuditEvent a) {
        return new AuditEventDto(a.getId(), a.getOccurredAt(), a.getActor(), a.getAction(), a.getEntityType(), a.getEntityId(),
            a.getOutcome(), a.getDetails(), a.getClientIp());
    }
}

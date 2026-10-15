package com.meridian.sam.service;

import com.meridian.sam.audit.AuditService;
import com.meridian.sam.auth.AccessDeniedException;
import com.meridian.sam.auth.CurrentUser;
import com.meridian.sam.auth.Permissions;
import com.meridian.sam.domain.DisturbanceRecord;
import com.meridian.sam.domain.Role;
import com.meridian.sam.repository.DisturbanceRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class RecordService {
    private static final DateTimeFormatter COMTRADE_TS = DateTimeFormatter.ofPattern("dd/MM/yyyy,HH:mm:ss.SSSSSS");
    private final DisturbanceRecordRepository records;
    private final AuditService audit;
    private final Clock clock;

    public RecordService(DisturbanceRecordRepository records, AuditService audit, Clock clock) {
        this.records = records; this.audit = audit; this.clock = clock;
    }

    public List<DisturbanceRecord> search(Long iedId, Long substationId, OffsetDateTime from, OffsetDateTime to, Boolean downloaded) {
        return records.search(iedId, substationId, from, to, downloaded);
    }

    public DisturbanceRecord get(Long id) {
        return records.findWithIedById(id).orElseThrow(() -> new NotFoundException("Disturbance record", id));
    }

    /** Marks the record as retrieved and returns the COMTRADE configuration (.cfg) header text. */
    @Transactional
    public String download(Long id, CurrentUser user, String clientIp) {
        DisturbanceRecord rec = get(id);
        try {
            Permissions.require(user, Role::canDownloadRecords, "download disturbance records");
            rec.markDownloaded(user.username(), OffsetDateTime.now(clock));
            audit.record(user.username(), "RECORD_DOWNLOAD", "RECORD", rec.getRecordId(), "SUCCESS",
                String.format("COMTRADE triplet downloaded (%.1f MB)", rec.getSizeBytes() / 1_048_576.0), clientIp);
            return comtradeCfg(rec);
        } catch (RuntimeException e) {
            audit.record(user.username(), "RECORD_DOWNLOAD", "RECORD", rec.getRecordId(),
                e instanceof AccessDeniedException ? "DENIED" : "FAILURE", e.getMessage(), clientIp);
            throw e;
        }
    }

    /** IEEE C37.111-2013 / IEC 60255-24 .cfg layout: station,device,revision; channel counts; channel lines; frequency; rates; timestamps; file type. */
    static String comtradeCfg(DisturbanceRecord rec) {
        StringBuilder sb = new StringBuilder();
        String rev = rec.getFileFormat().endsWith("2013") ? "2013" : "1999";
        sb.append(rec.getIed().getBay().getSubstation().getCode()).append(',').append(rec.getIed().getName()).append(',').append(rev).append('\n');
        int total = rec.getAnalogChannels() + rec.getDigitalChannels();
        sb.append(total).append(',').append(rec.getAnalogChannels()).append("A,").append(rec.getDigitalChannels()).append("D\n");
        String[] analog = {"IA", "IB", "IC", "IN", "VA", "VB", "VC", "VN", "IA2", "IB2", "IC2", "IN2"};
        for (int i = 0; i < rec.getAnalogChannels(); i++) {
            String ch = i < analog.length ? analog[i] : "AN" + (i + 1);
            String unit = ch.startsWith("V") ? "V" : "A";
            sb.append(i + 1).append(',').append(ch).append(",,,").append(unit).append(",0.001,0,0,-32767,32767,1,1,P\n");
        }
        for (int i = 0; i < rec.getDigitalChannels(); i++) {
            sb.append(i + 1).append(",DI").append(String.format("%02d", i + 1)).append(",,,0\n");
        }
        sb.append("50\n1\n");
        long samples = (long) rec.getSampleRateHz() * rec.getDurationMs() / 1000;
        sb.append(rec.getSampleRateHz()).append(',').append(samples).append('\n');
        OffsetDateTime start = rec.getTriggeredAt().minusNanos(200_000_000L);
        sb.append(COMTRADE_TS.format(start)).append('\n').append(COMTRADE_TS.format(rec.getTriggeredAt())).append('\n');
        sb.append("BINARY\n1.0\n");
        if (rev.equals("2013")) sb.append("+0h00\n1\n");
        return sb.toString();
    }
}

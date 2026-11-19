package com.meridian.sam.service;

import com.meridian.sam.domain.Ied;
import com.meridian.sam.domain.SettingsFile;
import com.meridian.sam.domain.SettingsStatus;
import com.meridian.sam.repository.DisturbanceRecordRepository;
import com.meridian.sam.repository.IedRepository;
import com.meridian.sam.repository.SclImportRepository;
import com.meridian.sam.repository.SettingsFileRepository;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@Transactional
class IedServiceStatsTest {
    @Autowired IedService service;
    @Autowired IedRepository ieds;
    @Autowired SettingsFileRepository settingsFiles;
    @Autowired DisturbanceRecordRepository records;
    @Autowired SclImportRepository sclImports;
    @Autowired EntityManagerFactory emf;

    /** The per-IED queries the bulk path replaced; kept here as the oracle for its semantics. */
    private IedStats perRow(Long id) {
        Integer active = settingsFiles.findFirstByIedIdAndStatus(id, SettingsStatus.ACTIVE).map(SettingsFile::getVersionNo).orElse(null);
        List<String> names = sclImports.matchedSclIedNames(id);
        return new IedStats(active, settingsFiles.countByIedId(id), records.countByIedId(id), names.isEmpty() ? null : names.get(0));
    }

    @Test
    void bulkStatsMatchPerRowQueriesForWholeFleet() {
        List<Long> ids = ieds.findAll().stream().map(Ied::getId).toList();
        Map<Long, IedStats> bulk = service.stats(ids);

        assertThat(bulk.keySet()).containsExactlyElementsOf(ids);
        ids.forEach(id -> assertThat(bulk.get(id)).as("IED %d", id).isEqualTo(perRow(id)));
        assertThat(bulk.values()).anyMatch(s -> s.activeSettingsVersion() != null)
            .anyMatch(s -> s.activeSettingsVersion() == null)
            .anyMatch(s -> s.sclIedName() != null)
            .anyMatch(s -> s.recordCount() > 0);
    }

    @Test
    void bulkStatsIssueFourQueriesRegardlessOfFleetSize() {
        List<Long> ids = ieds.findAll().stream().map(Ied::getId).toList();
        assertThat(ids).hasSizeGreaterThan(4);
        Statistics stats = emf.unwrap(SessionFactory.class).getStatistics();
        stats.clear();

        service.stats(ids);

        assertThat(stats.getPrepareStatementCount()).isEqualTo(4);
    }

    @Test
    void unknownAndEmptyInputs() {
        assertThat(service.stats(List.of())).isEmpty();
        assertThat(service.stats(List.of(9999L))).containsEntry(9999L, IedStats.NONE);
    }
}

package com.meridian.sam.repository;

import com.meridian.sam.domain.SettingsFile;
import com.meridian.sam.domain.SettingsStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SettingsFileRepository extends JpaRepository<SettingsFile, Long> {
    @EntityGraph(attributePaths = {"ied"})
    List<SettingsFile> findByIedIdOrderByVersionNoDesc(Long iedId);

    Optional<SettingsFile> findFirstByIedIdAndStatus(Long iedId, SettingsStatus status);

    long countByIedId(Long iedId);

    /** Rows of {@code [iedId, count]}; IEDs with no settings files are absent. */
    @Query("select f.ied.id, count(f) from SettingsFile f where f.ied.id in :iedIds group by f.ied.id")
    List<Object[]> countByIedIds(@Param("iedIds") Collection<Long> iedIds);

    /** Rows of {@code [iedId, versionNo]} for files in the given status, highest version first per IED. */
    @Query("select f.ied.id, f.versionNo from SettingsFile f where f.ied.id in :iedIds and f.status = :status order by f.ied.id, f.versionNo desc")
    List<Object[]> versionNosByIedIdsAndStatus(@Param("iedIds") Collection<Long> iedIds, @Param("status") SettingsStatus status);

    @EntityGraph(attributePaths = {"values", "ied", "ied.bay", "ied.bay.substation"})
    Optional<SettingsFile> findWithValuesById(Long id);

    Optional<SettingsFile> findFirstByIedIdOrderByVersionNoDesc(Long iedId);
}

package com.meridian.sam.repository;

import com.meridian.sam.domain.SettingsFile;
import com.meridian.sam.domain.SettingsStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SettingsFileRepository extends JpaRepository<SettingsFile, Long> {
    @EntityGraph(attributePaths = {"ied"})
    List<SettingsFile> findByIedIdOrderByVersionNoDesc(Long iedId);

    Optional<SettingsFile> findFirstByIedIdAndStatus(Long iedId, SettingsStatus status);

    long countByIedId(Long iedId);

    @EntityGraph(attributePaths = {"values", "ied", "ied.bay", "ied.bay.substation"})
    Optional<SettingsFile> findWithValuesById(Long id);

    Optional<SettingsFile> findFirstByIedIdOrderByVersionNoDesc(Long iedId);
}

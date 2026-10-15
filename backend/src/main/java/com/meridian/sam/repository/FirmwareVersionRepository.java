package com.meridian.sam.repository;

import com.meridian.sam.domain.FirmwareVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FirmwareVersionRepository extends JpaRepository<FirmwareVersion, Long> {
    List<FirmwareVersion> findAllByOrderByPlatformAscReleasedOnDesc();
    List<FirmwareVersion> findByPlatformOrderByReleasedOnDesc(String platform);
}

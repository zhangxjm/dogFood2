package com.iot.monitor.repository;

import com.iot.common.entity.Telemetry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TelemetryRepository extends JpaRepository<Telemetry, Long> {

    List<Telemetry> findByDeviceIdOrderByTimestampDesc(String deviceId);

    Page<Telemetry> findByDeviceIdOrderByTimestampDesc(String deviceId, Pageable pageable);

    List<Telemetry> findByDeviceIdAndMetricOrderByTimestampDesc(String deviceId, String metric);

    @Query("SELECT t FROM Telemetry t WHERE t.deviceId = :deviceId AND t.metric = :metric AND t.timestamp >= :startTime AND t.timestamp <= :endTime ORDER BY t.timestamp ASC")
    List<Telemetry> findByDeviceIdAndMetricAndTimeRange(
            @Param("deviceId") String deviceId,
            @Param("metric") String metric,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT DISTINCT t.metric FROM Telemetry t WHERE t.deviceId = :deviceId")
    List<String> findDistinctMetricsByDeviceId(@Param("deviceId") String deviceId);

}

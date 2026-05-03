package com.iot.alarm.repository;

import com.iot.common.entity.AlarmRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlarmRuleRepository extends JpaRepository<AlarmRule, Long> {

    List<AlarmRule> findByIsEnabledTrue();

    List<AlarmRule> findByDeviceIdAndMetricAndIsEnabledTrue(String deviceId, String metric);

    @Query("SELECT ar FROM AlarmRule ar WHERE ar.isEnabled = true AND (ar.deviceId = :deviceId OR ar.deviceId IS NULL)")
    List<AlarmRule> findActiveRulesForDevice(@Param("deviceId") String deviceId);

    Optional<AlarmRule> findByRuleName(String ruleName);

}

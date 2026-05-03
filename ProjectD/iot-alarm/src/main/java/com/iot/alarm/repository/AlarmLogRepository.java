package com.iot.alarm.repository;

import com.iot.common.entity.AlarmLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlarmLogRepository extends JpaRepository<AlarmLog, Long> {

    List<AlarmLog> findByDeviceIdOrderByAlarmTimeDesc(String deviceId);

    Page<AlarmLog> findByDeviceIdOrderByAlarmTimeDesc(String deviceId, Pageable pageable);

    Page<AlarmLog> findAllByOrderByAlarmTimeDesc(Pageable pageable);

    List<AlarmLog> findByIsReadFalse();

    long countByIsReadFalse();

}

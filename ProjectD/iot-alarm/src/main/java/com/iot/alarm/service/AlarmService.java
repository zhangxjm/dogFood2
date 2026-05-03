package com.iot.alarm.service;

import com.iot.common.entity.AlarmLog;
import com.iot.common.entity.AlarmRule;
import com.iot.common.entity.Telemetry;
import com.iot.device.handler.MqttMessageHandler;
import com.iot.alarm.repository.AlarmLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class AlarmService {

    @Autowired
    private AlarmRuleService alarmRuleService;

    @Autowired
    private AlarmLogRepository alarmLogRepository;

    @EventListener
    @Transactional
    public void handleTelemetryEvent(MqttMessageHandler.TelemetryEvent event) {
        Telemetry telemetry = event.getTelemetry();
        checkAndTriggerAlarm(telemetry);
    }

    public void checkAndTriggerAlarm(Telemetry telemetry) {
        List<AlarmRule> rules = alarmRuleService.getActiveRulesForDevice(telemetry.getDeviceId());
        
        for (AlarmRule rule : rules) {
            if (!rule.getMetric().equals(telemetry.getMetric())) {
                continue;
            }
            
            if (matchesCondition(telemetry.getValue(), rule.getOperator(), rule.getThreshold())) {
                triggerAlarm(rule, telemetry);
            }
        }
    }

    private boolean matchesCondition(Double actualValue, String operator, Double threshold) {
        switch (operator) {
            case "gt":
                return actualValue > threshold;
            case "gte":
                return actualValue >= threshold;
            case "lt":
                return actualValue < threshold;
            case "lte":
                return actualValue <= threshold;
            case "eq":
                return Math.abs(actualValue - threshold) < 0.0001;
            case "neq":
                return Math.abs(actualValue - threshold) >= 0.0001;
            default:
                return false;
        }
    }

    private void triggerAlarm(AlarmRule rule, Telemetry telemetry) {
        AlarmLog alarmLog = new AlarmLog();
        alarmLog.setRuleId(rule.getId());
        alarmLog.setDeviceId(telemetry.getDeviceId());
        alarmLog.setMetric(telemetry.getMetric());
        alarmLog.setActualValue(telemetry.getValue());
        alarmLog.setThreshold(rule.getThreshold());
        alarmLog.setOperator(rule.getOperator());
        alarmLog.setSeverity(rule.getSeverity());
        alarmLog.setIsRead(false);
        alarmLog.setAlarmTime(LocalDateTime.now());
        
        String message = buildAlarmMessage(rule, telemetry);
        alarmLog.setMessage(message);
        
        alarmLogRepository.save(alarmLog);
        log.warn("告警触发: deviceId={}, metric={}, actual={}, threshold={}, operator={}",
                telemetry.getDeviceId(), telemetry.getMetric(), telemetry.getValue(),
                rule.getThreshold(), rule.getOperator());
        
        sendNotification(rule, alarmLog);
    }

    private String buildAlarmMessage(AlarmRule rule, Telemetry telemetry) {
        String operatorText = getOperatorText(rule.getOperator());
        return String.format("设备 [%s] 的指标 [%s] 当前值为 %.2f，%s 阈值 %.2f",
                telemetry.getDeviceId(),
                telemetry.getMetric(),
                telemetry.getValue(),
                operatorText,
                rule.getThreshold());
    }

    private String getOperatorText(String operator) {
        switch (operator) {
            case "gt": return "大于";
            case "gte": return "大于等于";
            case "lt": return "小于";
            case "lte": return "小于等于";
            case "eq": return "等于";
            case "neq": return "不等于";
            default: return operator;
        }
    }

    private void sendNotification(AlarmRule rule, AlarmLog alarmLog) {
        String notificationType = rule.getNotificationType();
        if ("none".equals(notificationType) || notificationType == null) {
            return;
        }
        
        log.info("发送告警通知 - type={}, message={}", notificationType, alarmLog.getMessage());
    }

    public Page<AlarmLog> getAlarmLogs(int page, int size) {
        return alarmLogRepository.findAllByOrderByAlarmTimeDesc(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "alarmTime")));
    }

    public Page<AlarmLog> getAlarmLogsByDevice(String deviceId, int page, int size) {
        return alarmLogRepository.findByDeviceIdOrderByAlarmTimeDesc(
                deviceId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "alarmTime")));
    }

    @Transactional
    public void markAsRead(Long id) {
        AlarmLog log = alarmLogRepository.findById(id).orElse(null);
        if (log != null) {
            log.setIsRead(true);
            alarmLogRepository.save(log);
        }
    }

    public long getUnreadCount() {
        return alarmLogRepository.countByIsReadFalse();
    }

}

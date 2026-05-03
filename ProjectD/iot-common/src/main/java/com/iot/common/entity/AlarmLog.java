package com.iot.common.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "iot_alarm_log")
public class AlarmLog extends BaseEntity {

    @Column(name = "rule_id")
    private Long ruleId;

    @Column(name = "device_id", nullable = false)
    private String deviceId;

    @Column(name = "metric", nullable = false)
    private String metric;

    @Column(name = "actual_value", nullable = false)
    private Double actualValue;

    @Column(name = "threshold", nullable = false)
    private Double threshold;

    @Column(name = "operator", nullable = false)
    private String operator;

    @Column(name = "severity")
    private String severity;

    @Column(name = "message")
    private String message;

    @Column(name = "is_read")
    private Boolean isRead;

    @Column(name = "alarm_time", nullable = false)
    private LocalDateTime alarmTime;

}

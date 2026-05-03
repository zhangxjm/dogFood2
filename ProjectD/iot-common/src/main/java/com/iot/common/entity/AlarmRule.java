package com.iot.common.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "iot_alarm_rule")
public class AlarmRule extends BaseEntity {

    @Column(name = "rule_name", nullable = false)
    private String ruleName;

    @Column(name = "device_id")
    private String deviceId;

    @Column(name = "metric", nullable = false)
    private String metric;

    @Column(name = "operator", nullable = false)
    private String operator;

    @Column(name = "threshold", nullable = false)
    private Double threshold;

    @Column(name = "severity")
    private String severity;

    @Column(name = "notification_type")
    private String notificationType;

    @Column(name = "is_enabled")
    private Boolean isEnabled;

}

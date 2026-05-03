package com.iot.common.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "iot_device")
public class Device extends BaseEntity {

    @Column(name = "device_id", unique = true, nullable = false)
    private String deviceId;

    @Column(name = "device_name", nullable = false)
    private String deviceName;

    @Column(name = "device_type")
    private String deviceType;

    @Column(name = "secret", nullable = false)
    private String secret;

    @Column(name = "status")
    private String status;

    @Column(name = "last_online_time")
    private java.time.LocalDateTime lastOnlineTime;

    @Column(name = "description")
    private String description;

}

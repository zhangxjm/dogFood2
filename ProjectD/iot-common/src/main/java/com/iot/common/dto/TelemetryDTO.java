package com.iot.common.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TelemetryDTO {

    private String deviceId;
    private String metric;
    private Double value;
    private String unit;
    private LocalDateTime timestamp;

}

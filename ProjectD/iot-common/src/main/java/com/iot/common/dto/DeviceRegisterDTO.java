package com.iot.common.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class DeviceRegisterDTO {

    @NotBlank(message = "设备ID不能为空")
    private String deviceId;

    @NotBlank(message = "设备名称不能为空")
    private String deviceName;

    private String deviceType;

    private String description;

}

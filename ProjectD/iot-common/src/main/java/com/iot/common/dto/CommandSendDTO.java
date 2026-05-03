package com.iot.common.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class CommandSendDTO {

    @NotBlank(message = "设备ID不能为空")
    private String deviceId;

    @NotBlank(message = "指令类型不能为空")
    private String commandType;

    @NotNull(message = "指令数据不能为空")
    private Object data;

}

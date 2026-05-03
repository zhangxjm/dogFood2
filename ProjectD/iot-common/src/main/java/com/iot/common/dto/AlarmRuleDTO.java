package com.iot.common.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class AlarmRuleDTO {

    @NotBlank(message = "规则名称不能为空")
    private String ruleName;

    private String deviceId;

    @NotBlank(message = "指标不能为空")
    private String metric;

    @NotBlank(message = "操作符不能为空")
    private String operator;

    @NotNull(message = "阈值不能为空")
    private Double threshold;

    private String severity = "medium";
    private String notificationType = "none";
    private Boolean isEnabled = true;

}

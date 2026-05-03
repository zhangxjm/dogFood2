package com.iot.alarm.controller;

import com.iot.common.dto.AlarmRuleDTO;
import com.iot.common.entity.AlarmLog;
import com.iot.common.entity.AlarmRule;
import com.iot.common.response.Result;
import com.iot.alarm.service.AlarmRuleService;
import com.iot.alarm.service.AlarmService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alarm")
public class AlarmController {

    @Autowired
    private AlarmRuleService alarmRuleService;

    @Autowired
    private AlarmService alarmService;

    @PostMapping("/rules")
    public Result<AlarmRule> createRule(@Valid @RequestBody AlarmRuleDTO dto) {
        return Result.success(alarmRuleService.createRule(dto));
    }

    @GetMapping("/rules")
    public Result<List<AlarmRule>> listRules() {
        return Result.success(alarmRuleService.findAll());
    }

    @GetMapping("/rules/{id}")
    public Result<AlarmRule> getRule(@PathVariable Long id) {
        return Result.success(alarmRuleService.getById(id));
    }

    @PutMapping("/rules/{id}")
    public Result<AlarmRule> updateRule(@PathVariable Long id, @Valid @RequestBody AlarmRuleDTO dto) {
        return Result.success(alarmRuleService.updateRule(id, dto));
    }

    @DeleteMapping("/rules/{id}")
    public Result<Void> deleteRule(@PathVariable Long id) {
        alarmRuleService.deleteRule(id);
        return Result.success();
    }

    @PutMapping("/rules/{id}/toggle")
    public Result<Void> toggleRule(@PathVariable Long id, @RequestParam Boolean enabled) {
        alarmRuleService.toggleRule(id, enabled);
        return Result.success();
    }

    @GetMapping("/logs")
    public Result<Page<AlarmLog>> getAlarmLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(alarmService.getAlarmLogs(page, size));
    }

    @GetMapping("/logs/device/{deviceId}")
    public Result<Page<AlarmLog>> getAlarmLogsByDevice(
            @PathVariable String deviceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(alarmService.getAlarmLogsByDevice(deviceId, page, size));
    }

    @PutMapping("/logs/{id}/read")
    public Result<Void> markAsRead(@PathVariable Long id) {
        alarmService.markAsRead(id);
        return Result.success();
    }

    @GetMapping("/logs/unread/count")
    public Result<Map<String, Object>> getUnreadCount() {
        Map<String, Object> result = new HashMap<>();
        result.put("count", alarmService.getUnreadCount());
        return Result.success(result);
    }

}

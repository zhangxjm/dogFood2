package com.iot.monitor.controller;

import com.iot.common.dto.TelemetryDTO;
import com.iot.common.entity.Telemetry;
import com.iot.common.response.Result;
import com.iot.monitor.service.DashboardService;
import com.iot.monitor.service.TelemetryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/monitor")
public class MonitorController {

    @Autowired
    private TelemetryService telemetryService;

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/dashboard/stats")
    public Result<Map<String, Object>> getDashboardStats() {
        return Result.success(dashboardService.getDashboardStats());
    }

    @GetMapping("/dashboard/devices")
    public Result<List<Map<String, Object>>> getDeviceStatusList() {
        return Result.success(dashboardService.getDeviceStatusList());
    }

    @GetMapping("/telemetry/{deviceId}/latest")
    public Result<List<Telemetry>> getLatestTelemetry(
            @PathVariable String deviceId,
            @RequestParam(defaultValue = "50") int limit) {
        return Result.success(telemetryService.getLatestTelemetry(deviceId, limit));
    }

    @GetMapping("/telemetry/{deviceId}/metrics")
    public Result<List<String>> getDeviceMetrics(@PathVariable String deviceId) {
        return Result.success(telemetryService.getDeviceMetrics(deviceId));
    }

    @GetMapping("/telemetry/{deviceId}/latest-values")
    public Result<Map<String, Object>> getDeviceLatestMetrics(@PathVariable String deviceId) {
        return Result.success(telemetryService.getDeviceLatestMetrics(deviceId));
    }

    @GetMapping("/telemetry/{deviceId}/{metric}")
    public Result<List<Telemetry>> getTelemetryByMetric(
            @PathVariable String deviceId,
            @PathVariable String metric) {
        return Result.success(telemetryService.getTelemetryByMetric(deviceId, metric));
    }

    @GetMapping("/telemetry/{deviceId}/{metric}/range")
    public Result<List<Telemetry>> getTelemetryByTimeRange(
            @PathVariable String deviceId,
            @PathVariable String metric,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        return Result.success(telemetryService.getTelemetryByTimeRange(deviceId, metric, startTime, endTime));
    }

}

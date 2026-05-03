package com.iot.monitor.service;

import com.iot.common.entity.Device;
import com.iot.device.service.DeviceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DashboardService {

    @Autowired
    private DeviceService deviceService;

    @Autowired
    private TelemetryService telemetryService;

    public Map<String, Object> getDashboardStats() {
        List<Device> devices = deviceService.findAll();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDevices", devices.size());
        stats.put("onlineDevices", (int) devices.stream()
                .filter(d -> "online".equals(d.getStatus())).count());
        stats.put("offlineDevices", (int) devices.stream()
                .filter(d -> "offline".equals(d.getStatus())).count());
        
        return stats;
    }

    public List<Map<String, Object>> getDeviceStatusList() {
        List<Device> devices = deviceService.findAll();
        return devices.stream().map(device -> {
            Map<String, Object> item = new HashMap<>();
            item.put("deviceId", device.getDeviceId());
            item.put("deviceName", device.getDeviceName());
            item.put("status", device.getStatus());
            item.put("deviceType", device.getDeviceType());
            item.put("lastOnlineTime", device.getLastOnlineTime());
            return item;
        }).collect(Collectors.toList());
    }

}

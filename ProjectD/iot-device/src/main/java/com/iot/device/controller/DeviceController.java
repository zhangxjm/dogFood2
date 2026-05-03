package com.iot.device.controller;

import com.iot.common.dto.DeviceRegisterDTO;
import com.iot.common.entity.Device;
import com.iot.common.response.Result;
import com.iot.device.service.DeviceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/device")
public class DeviceController {

    @Autowired
    private DeviceService deviceService;

    @PostMapping("/register")
    public Result<Map<String, Object>> register(@Valid @RequestBody DeviceRegisterDTO dto) {
        Device device = deviceService.register(dto);
        Map<String, Object> result = new HashMap<>();
        result.put("deviceId", device.getDeviceId());
        result.put("deviceName", device.getDeviceName());
        result.put("secret", device.getSecret());
        result.put("status", device.getStatus());
        return Result.success(result);
    }

    @GetMapping("/list")
    public Result<List<Device>> list() {
        return Result.success(deviceService.findAll());
    }

    @GetMapping("/{deviceId}")
    public Result<Device> getByDeviceId(@PathVariable String deviceId) {
        return Result.success(deviceService.getByDeviceId(deviceId));
    }

    @DeleteMapping("/{deviceId}")
    public Result<Void> delete(@PathVariable String deviceId) {
        deviceService.deleteByDeviceId(deviceId);
        return Result.success();
    }

}

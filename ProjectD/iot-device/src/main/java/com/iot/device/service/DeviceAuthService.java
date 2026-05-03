package com.iot.device.service;

import com.iot.common.entity.Device;
import com.iot.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class DeviceAuthService {

    @Autowired
    private DeviceService deviceService;

    public boolean authenticate(String deviceId, String secret) {
        Device device = deviceService.getByDeviceId(deviceId);
        boolean valid = secret.equals(device.getSecret());
        if (!valid) {
            log.warn("设备认证失败: deviceId={}", deviceId);
        }
        return valid;
    }

    public String login(String deviceId, String secret) {
        if (!authenticate(deviceId, secret)) {
            throw new BusinessException(401, "设备认证失败");
        }
        
        deviceService.updateStatus(deviceId, "online");
        
        log.info("设备登录成功: deviceId={}", deviceId);
        return "Device authenticated successfully";
    }

    public void logout(String deviceId) {
        try {
            deviceService.updateStatus(deviceId, "offline");
            log.info("设备登出: deviceId={}", deviceId);
        } catch (Exception e) {
            log.warn("设备登出处理失败: deviceId={}", deviceId, e);
        }
    }

}

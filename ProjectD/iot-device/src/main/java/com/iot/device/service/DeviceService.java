package com.iot.device.service;

import com.iot.common.dto.DeviceRegisterDTO;
import com.iot.common.entity.Device;
import com.iot.common.exception.BusinessException;
import com.iot.device.repository.DeviceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class DeviceService {

    @Autowired
    private DeviceRepository deviceRepository;

    @Transactional
    public Device register(DeviceRegisterDTO dto) {
        if (deviceRepository.existsByDeviceId(dto.getDeviceId())) {
            throw new BusinessException("设备ID已存在");
        }
        
        Device device = new Device();
        device.setDeviceId(dto.getDeviceId());
        device.setDeviceName(dto.getDeviceName());
        device.setDeviceType(dto.getDeviceType() != null ? dto.getDeviceType() : "sensor");
        device.setSecret(generateSecret());
        device.setStatus("offline");
        device.setDescription(dto.getDescription());
        
        Device saved = deviceRepository.save(device);
        log.info("设备注册成功: deviceId={}, deviceName={}", saved.getDeviceId(), saved.getDeviceName());
        return saved;
    }

    public Optional<Device> findByDeviceId(String deviceId) {
        return deviceRepository.findByDeviceId(deviceId);
    }

    public Device getByDeviceId(String deviceId) {
        return deviceRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new BusinessException("设备不存在"));
    }

    public List<Device> findAll() {
        return deviceRepository.findAll();
    }

    @Transactional
    public void updateStatus(String deviceId, String status) {
        Device device = getByDeviceId(deviceId);
        device.setStatus(status);
        if ("online".equals(status)) {
            device.setLastOnlineTime(LocalDateTime.now());
        }
        deviceRepository.save(device);
        log.info("设备状态更新: deviceId={}, status={}", deviceId, status);
    }

    @Transactional
    public void deleteByDeviceId(String deviceId) {
        Device device = getByDeviceId(deviceId);
        deviceRepository.delete(device);
        log.info("设备删除: deviceId={}", deviceId);
    }

    private String generateSecret() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

}

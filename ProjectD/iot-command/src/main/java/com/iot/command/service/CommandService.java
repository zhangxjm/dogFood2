package com.iot.command.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.iot.common.dto.CommandSendDTO;
import com.iot.common.entity.Device;
import com.iot.common.exception.BusinessException;
import com.iot.device.service.DeviceService;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class CommandService {

    @Autowired
    private MqttClient mqttClient;

    @Autowired
    private DeviceService deviceService;

    private static final String TOPIC_COMMAND_PREFIX = "iot/command/";

    public Map<String, Object> sendCommand(CommandSendDTO dto) {
        if (mqttClient == null) {
            throw new BusinessException("MQTT服务未连接，无法发送指令");
        }
        
        Device device = deviceService.getByDeviceId(dto.getDeviceId());
        
        if (!"online".equals(device.getStatus())) {
            throw new BusinessException("设备不在线，无法发送指令");
        }
        
        String commandId = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        
        JSONObject command = new JSONObject();
        command.put("commandId", commandId);
        command.put("commandType", dto.getCommandType());
        command.put("data", dto.getData());
        command.put("timestamp", System.currentTimeMillis());
        
        try {
            String topic = TOPIC_COMMAND_PREFIX + dto.getDeviceId();
            MqttMessage message = new MqttMessage(command.toJSONString().getBytes());
            message.setQos(1);
            mqttClient.publish(topic, message);
            
            log.info("指令发送成功 - deviceId={}, commandId={}, commandType={}", 
                    dto.getDeviceId(), commandId, dto.getCommandType());
            
            Map<String, Object> result = new HashMap<>();
            result.put("commandId", commandId);
            result.put("deviceId", dto.getDeviceId());
            result.put("commandType", dto.getCommandType());
            result.put("status", "sent");
            
            return result;
        } catch (Exception e) {
            log.error("指令发送失败 - deviceId={}, commandType={}", dto.getDeviceId(), dto.getCommandType(), e);
            throw new BusinessException("指令发送失败: " + e.getMessage());
        }
    }

    public Map<String, Object> sendBroadcastCommand(CommandSendDTO dto) {
        if (mqttClient == null) {
            throw new BusinessException("MQTT服务未连接，无法发送广播指令");
        }
        
        String commandId = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        
        JSONObject command = new JSONObject();
        command.put("commandId", commandId);
        command.put("commandType", dto.getCommandType());
        command.put("data", dto.getData());
        command.put("timestamp", System.currentTimeMillis());
        
        try {
            String topic = "iot/command/broadcast";
            MqttMessage message = new MqttMessage(command.toJSONString().getBytes());
            message.setQos(1);
            mqttClient.publish(topic, message);
            
            log.info("广播指令发送成功 - commandId={}, commandType={}", commandId, dto.getCommandType());
            
            Map<String, Object> result = new HashMap<>();
            result.put("commandId", commandId);
            result.put("commandType", dto.getCommandType());
            result.put("status", "broadcasted");
            
            return result;
        } catch (Exception e) {
            log.error("广播指令发送失败 - commandType={}", dto.getCommandType(), e);
            throw new BusinessException("广播指令发送失败: " + e.getMessage());
        }
    }

}

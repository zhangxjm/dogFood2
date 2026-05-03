package com.iot.device.handler;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.iot.common.entity.Device;
import com.iot.common.entity.Telemetry;
import com.iot.device.service.DeviceAuthService;
import com.iot.device.service.DeviceService;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class MqttMessageHandler implements MqttCallback {

    @Autowired
    private org.eclipse.paho.client.mqttv3.MqttClient mqttClient;

    @Autowired
    private DeviceService deviceService;

    @Autowired
    private DeviceAuthService deviceAuthService;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    private static final String TOPIC_AUTH = "iot/auth/+";
    private static final String TOPIC_TELEMETRY = "iot/telemetry/+";
    private static final String TOPIC_STATUS = "iot/status/+";

    @PostConstruct
    public void init() {
        if (mqttClient == null) {
            log.warn("MQTT客户端未初始化，MQTT消息处理器将跳过初始化");
            return;
        }
        try {
            mqttClient.setCallback(this);
            mqttClient.subscribe(TOPIC_AUTH);
            mqttClient.subscribe(TOPIC_TELEMETRY);
            mqttClient.subscribe(TOPIC_STATUS);
            log.info("MQTT消息处理器初始化完成，已订阅主题");
        } catch (Exception e) {
            log.error("MQTT消息处理器初始化失败", e);
        }
    }

    @PreDestroy
    public void destroy() {
        if (mqttClient == null) {
            return;
        }
        try {
            mqttClient.unsubscribe(TOPIC_AUTH);
            mqttClient.unsubscribe(TOPIC_TELEMETRY);
            mqttClient.unsubscribe(TOPIC_STATUS);
            log.info("MQTT消息处理器已销毁");
        } catch (Exception e) {
            log.error("MQTT消息处理器销毁失败", e);
        }
    }

    @Override
    public void connectionLost(Throwable cause) {
        log.warn("MQTT连接丢失", cause);
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        String payload = new String(message.getPayload());
        log.info("收到MQTT消息 - 主题: {}, 内容: {}", topic, payload);

        try {
            if (topic.startsWith("iot/auth/")) {
                handleAuth(topic, payload);
            } else if (topic.startsWith("iot/telemetry/")) {
                handleTelemetry(topic, payload);
            } else if (topic.startsWith("iot/status/")) {
                handleStatus(topic, payload);
            }
        } catch (Exception e) {
            log.error("处理MQTT消息失败 - 主题: {}, 内容: {}", topic, payload, e);
        }
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
    }

    private void handleAuth(String topic, String payload) {
        String deviceId = extractDeviceId(topic);
        try {
            JSONObject json = JSON.parseObject(payload);
            String secret = json.getString("secret");
            
            boolean authenticated = deviceAuthService.authenticate(deviceId, secret);
            if (authenticated) {
                deviceService.updateStatus(deviceId, "online");
                log.info("设备认证成功: deviceId={}", deviceId);
                publishAuthResponse(deviceId, true, "认证成功");
            } else {
                log.warn("设备认证失败: deviceId={}", deviceId);
                publishAuthResponse(deviceId, false, "认证失败");
            }
        } catch (Exception e) {
            log.error("处理设备认证失败: deviceId={}", deviceId, e);
            publishAuthResponse(deviceId, false, "认证处理异常");
        }
    }

    private void handleTelemetry(String topic, String payload) {
        String deviceId = extractDeviceId(topic);
        
        try {
            Device device = deviceService.getByDeviceId(deviceId);
            
            JSONObject json = JSON.parseObject(payload);
            List<Telemetry> telemetryList = new ArrayList<>();
            
            for (String key : json.keySet()) {
                if (!"timestamp".equals(key)) {
                    Object value = json.get(key);
                    if (value instanceof Number) {
                        Telemetry telemetry = new Telemetry();
                        telemetry.setDeviceId(deviceId);
                        telemetry.setMetric(key);
                        telemetry.setValue(((Number) value).doubleValue());
                        telemetry.setTimestamp(LocalDateTime.now());
                        telemetryList.add(telemetry);
                    }
                }
            }
            
            if (!telemetryList.isEmpty()) {
                for (Telemetry telemetry : telemetryList) {
                    eventPublisher.publishEvent(new TelemetryEvent(this, telemetry));
                }
                log.info("处理遥测数据: deviceId={}, count={}", deviceId, telemetryList.size());
            }
            
        } catch (Exception e) {
            log.error("处理遥测数据失败: deviceId={}", deviceId, e);
        }
    }

    private void handleStatus(String topic, String payload) {
        String deviceId = extractDeviceId(topic);
        try {
            JSONObject json = JSON.parseObject(payload);
            String status = json.getString("status");
            
            if ("online".equals(status) || "offline".equals(status)) {
                deviceService.updateStatus(deviceId, status);
                log.info("设备状态更新: deviceId={}, status={}", deviceId, status);
            }
        } catch (Exception e) {
            log.error("处理设备状态失败: deviceId={}", deviceId, e);
        }
    }

    private void publishAuthResponse(String deviceId, boolean success, String message) {
        try {
            JSONObject response = new JSONObject();
            response.put("success", success);
            response.put("message", message);
            response.put("timestamp", System.currentTimeMillis());
            
            String topic = "iot/auth/response/" + deviceId;
            mqttClient.publish(topic, response.toJSONString().getBytes(), 1, false);
        } catch (Exception e) {
            log.error("发布认证响应失败", e);
        }
    }

    private String extractDeviceId(String topic) {
        String[] parts = topic.split("/");
        if (parts.length >= 3) {
            return parts[2];
        }
        return "unknown";
    }

    public static class TelemetryEvent {
        private Object source;
        private Telemetry telemetry;

        public TelemetryEvent(Object source, Telemetry telemetry) {
            this.source = source;
            this.telemetry = telemetry;
        }

        public Object getSource() {
            return source;
        }

        public Telemetry getTelemetry() {
            return telemetry;
        }
    }

}

package com.iot.common.config;

import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
@ConditionalOnProperty(name = "mqtt.enabled", havingValue = "true", matchIfMissing = true)
public class MqttConfig {

    @Autowired
    private MqttProperties mqttProperties;

    @Bean
    public MqttClient mqttClient() {
        try {
            String clientId = mqttProperties.getClientId() + "_" + System.currentTimeMillis();
            MemoryPersistence persistence = new MemoryPersistence();
            MqttClient client = new MqttClient(mqttProperties.getBroker(), clientId, persistence);
            
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(mqttProperties.getCleanSession());
            options.setConnectionTimeout(mqttProperties.getConnectionTimeout());
            options.setKeepAliveInterval(mqttProperties.getKeepAliveInterval());
            options.setAutomaticReconnect(true);
            
            if (mqttProperties.getUsername() != null && !mqttProperties.getUsername().isEmpty()) {
                options.setUserName(mqttProperties.getUsername());
            }
            if (mqttProperties.getPassword() != null && !mqttProperties.getPassword().isEmpty()) {
                options.setPassword(mqttProperties.getPassword().toCharArray());
            }
            
            log.info("正在连接MQTT Broker: {}", mqttProperties.getBroker());
            client.connect(options);
            log.info("MQTT连接成功");
            
            return client;
        } catch (MqttException e) {
            log.error("MQTT连接失败，系统将继续运行但MQTT功能不可用: {}", e.getMessage());
            return null;
        }
    }

}

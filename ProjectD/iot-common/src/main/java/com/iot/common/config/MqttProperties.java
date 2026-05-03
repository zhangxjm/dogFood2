package com.iot.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "mqtt")
public class MqttProperties {

    private String broker;
    private String username;
    private String password;
    private String clientId;
    private Integer keepAliveInterval;
    private Boolean cleanSession;
    private Integer connectionTimeout;

}

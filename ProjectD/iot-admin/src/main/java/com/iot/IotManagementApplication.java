package com.iot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.iot.common.entity")
@EnableJpaRepositories(basePackages = {"com.iot.device.repository", "com.iot.monitor.repository", "com.iot.alarm.repository"})
public class IotManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(IotManagementApplication.class, args);
    }

}

package com.iot.monitor.service;

import com.iot.common.entity.Telemetry;
import com.iot.common.exception.BusinessException;
import com.iot.device.handler.MqttMessageHandler;
import com.iot.monitor.repository.TelemetryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class TelemetryService {

    @Autowired
    private TelemetryRepository telemetryRepository;

    @EventListener
    @Transactional
    public void handleTelemetryEvent(MqttMessageHandler.TelemetryEvent event) {
        Telemetry telemetry = event.getTelemetry();
        telemetryRepository.save(telemetry);
        log.debug("遥测数据已保存: deviceId={}, metric={}, value={}", 
                telemetry.getDeviceId(), telemetry.getMetric(), telemetry.getValue());
    }

    public List<Telemetry> getLatestTelemetry(String deviceId, int limit) {
        Page<Telemetry> page = telemetryRepository.findByDeviceIdOrderByTimestampDesc(
                deviceId, PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "timestamp")));
        return page.getContent();
    }

    public List<Telemetry> getTelemetryByMetric(String deviceId, String metric) {
        return telemetryRepository.findByDeviceIdAndMetricOrderByTimestampDesc(deviceId, metric);
    }

    public List<Telemetry> getTelemetryByTimeRange(String deviceId, String metric, 
                                                     LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            throw new BusinessException("开始时间和结束时间不能为空");
        }
        return telemetryRepository.findByDeviceIdAndMetricAndTimeRange(deviceId, metric, startTime, endTime);
    }

    public List<String> getDeviceMetrics(String deviceId) {
        return telemetryRepository.findDistinctMetricsByDeviceId(deviceId);
    }

    public Map<String, Object> getDeviceLatestMetrics(String deviceId) {
        List<String> metrics = getDeviceMetrics(deviceId);
        Map<String, Object> result = new HashMap<>();
        
        for (String metric : metrics) {
            List<Telemetry> telemetries = getLatestTelemetry(deviceId, 1);
            for (Telemetry t : telemetries) {
                if (metric.equals(t.getMetric())) {
                    result.put(metric, t.getValue());
                    break;
                }
            }
        }
        
        return result;
    }

}

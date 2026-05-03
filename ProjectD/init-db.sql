-- 创建扩展
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 设备表
CREATE TABLE IF NOT EXISTS iot_device (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    device_name VARCHAR(200) NOT NULL,
    device_type VARCHAR(50) DEFAULT 'sensor',
    secret VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'offline',
    last_online_time TIMESTAMP,
    description TEXT,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 遥测数据表（超表）
CREATE TABLE IF NOT EXISTS iot_telemetry (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    metric VARCHAR(100) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit VARCHAR(50)
);

-- 转换为超表（按时间分区）
SELECT create_hypertable('iot_telemetry', 'timestamp', if_not_exists => TRUE);

-- 告警规则表
CREATE TABLE IF NOT EXISTS iot_alarm_rule (
    id BIGSERIAL PRIMARY KEY,
    rule_name VARCHAR(200) NOT NULL,
    device_id VARCHAR(100),
    metric VARCHAR(100) NOT NULL,
    operator VARCHAR(10) NOT NULL,
    threshold DOUBLE PRECISION NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    notification_type VARCHAR(20) DEFAULT 'none',
    is_enabled BOOLEAN DEFAULT TRUE,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 告警日志表
CREATE TABLE IF NOT EXISTS iot_alarm_log (
    id BIGSERIAL PRIMARY KEY,
    rule_id BIGINT,
    device_id VARCHAR(100) NOT NULL,
    metric VARCHAR(100) NOT NULL,
    actual_value DOUBLE PRECISION NOT NULL,
    threshold DOUBLE PRECISION NOT NULL,
    operator VARCHAR(10) NOT NULL,
    severity VARCHAR(20),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    alarm_time TIMESTAMP NOT NULL,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_telemetry_device ON iot_telemetry(device_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_metric ON iot_telemetry(metric);
CREATE INDEX IF NOT EXISTS idx_telemetry_time ON iot_telemetry(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alarm_log_device ON iot_alarm_log(device_id);
CREATE INDEX IF NOT EXISTS idx_alarm_log_time ON iot_alarm_log(alarm_time DESC);
CREATE INDEX IF NOT EXISTS idx_alarm_log_read ON iot_alarm_log(is_read);

-- 插入一些示例告警规则
INSERT INTO iot_alarm_rule (rule_name, metric, operator, threshold, severity, is_enabled)
VALUES 
('高温告警', 'temperature', 'gt', 40.0, 'high', true),
('低温告警', 'temperature', 'lt', 0.0, 'medium', true),
('高湿度告警', 'humidity', 'gt', 90.0, 'medium', true),
('低湿度告警', 'humidity', 'lt', 10.0, 'medium', true);

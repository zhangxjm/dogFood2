# 物联网设备管理系统

## 项目简介
一个完整的物联网设备管理系统，用于接入和管理智能传感器，监控其上报的数据，并能远程控制设备。

## 技术栈
- **后端**: Spring Boot 2.7.x, Eclipse Paho MQTT Client
- **数据库**: PostgreSQL + TimescaleDB (时序数据)
- **消息队列**: EMQX (MQTT Broker)
- **前端**: Vue 2 + Element UI + ECharts

## 核心功能
1. **设备注册与鉴权**: 设备通过MQTT接入，密钥认证
2. **设备状态监控**: 实时监控设备在线/离线状态
3. **数据遥测展示**: 展示设备上报的时序数据，支持图表可视化
4. **指令下发**: 向指定设备或所有设备发送控制命令
5. **告警规则**: 设置阈值，触发告警并通知

## 快速开始

### 环境要求
- JDK 8+
- Maven 3.6+
- Node.js 14+
- Docker Desktop

### 步骤1: 启动中间件
```bash
# Windows
start-services.bat

# 或手动执行
docker-compose up -d
```

### 步骤2: 构建后端项目
```bash
mvn clean package -DskipTests
```

### 步骤3: 启动后端服务
```bash
cd iot-admin
mvn spring-boot:run

# 或使用开发环境配置
mvn spring-boot:run -Dspring.profiles.active=dev
```

后端服务将在 http://localhost:8080 启动

### 步骤4: 安装前端依赖
```bash
cd iot-web
npm install
```

### 步骤5: 启动前端服务
```bash
cd iot-web
npm run dev
```

前端服务将在 http://localhost:8081 启动

## MQTT主题说明

| 主题 | 方向 | 说明 |
|------|------|------|
| `iot/auth/{deviceId}` | 设备→服务端 | 设备认证 |
| `iot/auth/response/{deviceId}` | 服务端→设备 | 认证响应 |
| `iot/telemetry/{deviceId}` | 设备→服务端 | 遥测数据上报 |
| `iot/status/{deviceId}` | 设备→服务端 | 设备状态更新 |
| `iot/command/{deviceId}` | 服务端→设备 | 指令下发 |
| `iot/command/broadcast` | 服务端→设备 | 广播指令 |

## 设备接入示例

### Python (paho-mqtt)
```python
import json
import paho.mqtt.client as mqtt
import time

# 配置
BROKER = "localhost"
PORT = 1883
DEVICE_ID = "sensor_001"
SECRET = "你的设备密钥"  # 注册后获取

def on_connect(client, userdata, flags, rc):
    print(f"连接结果: {rc}")
    if rc == 0:
        # 订阅响应主题
        client.subscribe(f"iot/auth/response/{DEVICE_ID}")

def on_message(client, userdata, msg):
    print(f"收到消息: {msg.topic} -> {msg.payload.decode()}")

# 创建客户端
client = mqtt.Client(client_id=DEVICE_ID)
client.on_connect = on_connect
client.on_message = on_message

# 连接
client.connect(BROKER, PORT, 60)
client.loop_start()

time.sleep(1)

# 1. 认证
auth_msg = json.dumps({"secret": SECRET})
client.publish(f"iot/auth/{DEVICE_ID}", auth_msg, qos=1)
print("发送认证消息")

time.sleep(2)

# 2. 上报遥测数据
telemetry = {
    "temperature": 25.5,
    "humidity": 60.2,
    "pressure": 101.3
}
client.publish(f"iot/telemetry/{DEVICE_ID}", json.dumps(telemetry), qos=1)
print("上报遥测数据")

# 3. 保持连接
try:
    while True:
        time.sleep(10)
        # 定时上报数据
        telemetry["temperature"] += 0.1
        client.publish(f"iot/telemetry/{DEVICE_ID}", json.dumps(telemetry), qos=1)
except KeyboardInterrupt:
    client.loop_stop()
    client.disconnect()
```

## API文档

### 设备管理
- `POST /api/device/register` - 注册设备
- `GET /api/device/list` - 获取设备列表
- `GET /api/device/{deviceId}` - 获取设备详情
- `DELETE /api/device/{deviceId}` - 删除设备

### 监控面板
- `GET /api/monitor/dashboard/stats` - 获取统计数据
- `GET /api/monitor/dashboard/devices` - 获取设备状态列表
- `GET /api/monitor/telemetry/{deviceId}/latest` - 获取最新遥测数据
- `GET /api/monitor/telemetry/{deviceId}/metrics` - 获取设备指标列表

### 指令下发
- `POST /api/command/send` - 发送指令到设备
- `POST /api/command/broadcast` - 发送广播指令

### 告警管理
- `GET/POST /api/alarm/rules` - 告警规则列表/创建
- `PUT/DELETE /api/alarm/rules/{id}` - 更新/删除告警规则
- `GET /api/alarm/logs` - 获取告警日志
- `PUT /api/alarm/logs/{id}/read` - 标记告警为已读

## 项目结构
```
ProjectD/
├── iot-admin/              # 启动模块
├── iot-common/             # 公共模块
│   ├── config/            # 配置类
│   ├── dto/               # 数据传输对象
│   ├── entity/            # 实体类
│   ├── exception/         # 异常处理
│   ├── response/          # 统一响应
│   └── util/              # 工具类
├── iot-device/             # 设备管理模块
├── iot-monitor/            # 监控模块
├── iot-command/            # 指令下发模块
├── iot-alarm/              # 告警模块
├── iot-web/                # 前端项目
├── docker-compose.yml      # Docker编排
├── init-db.sql            # 数据库初始化
├── start-services.bat     # Windows启动脚本
└── stop-services.bat      # Windows停止脚本
```

## 停止服务
```bash
# Windows
stop-services.bat

# 或手动执行
docker-compose down
```

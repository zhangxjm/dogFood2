# 智慧健康监测平台

一个基于前后端分离架构的个人健康数据管理平台，支持设备数据接入、健康数据可视化、健康报告生成和目标提醒设置。

## 技术栈

### 后端
- **框架**: Django 4.2 + Django REST Framework 3.14
- **数据库**: PostgreSQL 15
- **数据分析**: Pandas, NumPy
- **认证**: JWT (SimpleJWT)
- **跨域**: django-cors-headers

### 前端
- **框架**: React 18
- **UI组件**: Ant Design 5
- **数据可视化**: ECharts
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **构建工具**: Vite

## 项目结构

```
ProjectB/
├── backend/                    # 后端项目
│   ├── health_platform/       # Django项目配置
│   ├── users/                  # 用户管理应用
│   ├── devices/                # 设备管理应用
│   ├── health_data/            # 健康数据应用
│   ├── reports/                # 健康报告应用
│   ├── goals/                  # 目标与提醒应用
│   ├── manage.py               # Django管理脚本
│   ├── requirements.txt        # Python依赖
│   └── generate_test_data.py   # 测试数据生成脚本
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── components/         # 公共组件
│   │   ├── layouts/            # 布局组件
│   │   ├── pages/              # 页面组件
│   │   ├── services/           # API服务
│   │   ├── store/              # 状态管理
│   │   ├── App.jsx             # 主应用组件
│   │   ├── main.jsx            # 入口文件
│   │   └── index.css           # 全局样式
│   ├── index.html              # HTML模板
│   ├── package.json            # Node依赖
│   └── vite.config.js          # Vite配置
├── docker-compose.yml          # Docker编排配置
├── start.bat                   # Windows启动脚本
└── .env.example                # 环境变量示例
```

## 功能特性

### 1. 设备数据接入
- 支持模拟智能手环设备
- 设备绑定/解绑管理
- 设备状态监控
- 批量数据上传接口

### 2. 健康数据看板
- 心率趋势分析图表
- 步数统计与趋势
- 睡眠构成分析
- 健康指标实时统计

### 3. 健康报告生成
- 基于规则的智能分析
- 每日/每周/每月报告
- 个性化健康建议
- 健康风险警告

### 4. 目标与提醒设置
- 可定制的健康目标
- 自动进度追踪
- 久坐提醒
- 饮水提醒
- 自定义提醒

## 快速开始

### 环境要求
- Python 3.8+
- Node.js 16+
- Docker & Docker Desktop (用于PostgreSQL)
- Git

### 安装步骤

#### 1. 启动Docker Desktop
确保Docker Desktop正在运行。

#### 2. 启动PostgreSQL数据库
```bash
docker-compose up -d postgres
```

#### 3. 配置后端
```bash
cd backend

# 创建虚拟环境
py -m venv venv

# 激活虚拟环境 (Windows)
venv\Scripts\activate.bat

# 安装依赖
pip install -r requirements.txt

# 数据库迁移
py manage.py makemigrations
py manage.py migrate

# 创建管理员用户 (可选)
py manage.py createsuperuser

# 生成测试数据 (可选)
py generate_test_data.py

# 启动后端服务
py manage.py runserver
```

后端服务将在 http://localhost:8000 启动

#### 4. 配置前端
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将在 http://localhost:3000 启动

### 使用测试数据

运行测试数据生成脚本将创建以下内容：

**测试账号:**
- 用户名: `testuser`
- 密码: `test123456`

**生成的数据:**
- 最近7天的心率数据 ( ( (每15分钟一次 ( ( ( ( (

## API文档

### 认证接口
- `POST /api/token/` - 获取JWT Token
- `POST /api/token/refresh/` - 刷新Token

### 用户接口
- `GET /api/users/me/` - 获取当前用户信息
- `PUT /api/users/update_me/` - 更新用户信息

### 设备接口
- `GET /api/devices/my_devices/` - 获取用户设备列表
- `POST /api/devices/` - 创建设备 ( ( ( (
- `POST /api/devices/{id}/pair/` - 配对设备 ( ( ( (
- `POST /api/devices/{id}/unpair/` - 取消配对 ( ( (
- `POST /api/devices/{id}/sync/` - 同步设备 ( ( (

### 健康数据接口 ( ( (
- `GET /api/health/heart-rate/` - 获取心率数据 ( ( (
- `GET /api/health/steps/` - 获取步数数据 ( ( (
- `GET /api/health/sleep/` - 获取睡眠数据 ( ( (
- `POST /api/health/batch/upload/` - 批量上传数据 ( ( (
- `GET /api/health/batch/dashboard/` - 获取看板数据 ( ( (

### 报告接口 ( ( (
- `GET /api/reports/` - 获取报告列表 ( ( (
- `GET /api/reports/latest/` - 获取最新报告 ( ( (
- `POST /api/reports/generate/` - 生成报告 ( ( (

### 目标与提醒接口 ( ( (
- `GET /api/goals/goals/active/` - 获取活跃目标 ( ( (
- `POST /api/goals/goals/` - 创建目标 ( ( (
- `GET /api/goals/reminders/today/` - 获取今日提醒 ( ( (
- `POST /api/goals/reminders/` - 创建提醒 ( ( (
- `GET /api/goals/notifications/unread/` - 获取未读通知 ( ( (

## 数据模型 ( ( (

### 用户模型 ( ( (
- 用户基本信息 ( ( (
- 年龄 ( ( 性别 ( ( 身高 ( ( 体重 ( (

### 设备模型 ( (
- 设备类型 ( ( 状态 ( ( 电量 ( ( (

### 健康数据模型 ( (
- 心率数据 ( ( 步数数据 ( ( 睡眠数据 ( (

### 报告模型 ( (
- 报告类型 ( ( 健康评分 ( ( 建议 ( ( 警告 ( (

### 目标与提醒模型 ( (
- 目标类型 ( ( 进度追踪 ( ( 提醒类型 ( (

## 部署说明 ( ( (

### 开发环境 ( (
1. 启动Docker Desktop ( (
2. 运行 `docker-compose up -d` ( (
3. 按照安装步骤配置前后端 ( (

### 生产环境 ( (
1. 修改 `settings.py` ( (
   - 设置 `DEBUG=False` ( (
   - 配置 `ALLOWED_HOSTS` ( (
   - 使用生产级数据库 ( (
2. 收集静态文件 ( (
   - `py manage.py collectstatic` ( (
3. 配置反向代理 ( (
   - 使用Nginx或Apache ( (
4. 配置生产级数据库 ( (
   - 配置PostgreSQL连接池 ( (

## 许可证 ( (

MIT License ( (

## 贡献 ( (

欢迎提交Issue和Pull Request ( (

## 支持 ( (

如有问题 ( ( 请提交Issue ( (

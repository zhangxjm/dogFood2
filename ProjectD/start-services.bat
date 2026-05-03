@echo off
echo ========================================
echo 物联网设备管理系统 - 启动脚本
echo ========================================

echo.
echo [1/4] 检查Docker环境...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Docker，请先安装Docker Desktop
    pause
    exit /b 1
)
echo [OK] Docker已安装

echo.
echo [2/4] 启动中间件服务...
echo 正在启动PostgreSQL(TimescaleDB)和EMQX...
docker-compose up -d
if errorlevel 1 (
    echo [错误] 中间件启动失败
    pause
    exit /b 1
)

echo.
echo [3/4] 等待服务就绪...
echo 等待PostgreSQL准备就绪...
:wait_for_db
docker exec iot-postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    echo  等待中...
    timeout /t 5 /nobreak >nul
    goto wait_for_db
)
echo [OK] PostgreSQL已就绪

echo.
echo [4/4] 完成！
echo ========================================
echo 中间件服务已启动成功！
echo.
echo 服务信息：
echo   PostgreSQL: localhost:5432
echo     用户名: postgres
echo     密码: 123456
echo     数据库: iot_db
echo.
echo   EMQX Dashboard: http://localhost:18083
echo     用户名: admin
echo     密码: public
echo     MQTT端口: 1883
echo.
echo 下一步操作：
echo   1. 构建后端项目: mvn clean package
echo   2. 启动后端服务: cd iot-admin ^&^& mvn spring-boot:run
echo   3. 安装前端依赖: cd iot-web ^&^& npm install
echo   4. 启动前端服务: cd iot-web ^&^& npm run dev
echo ========================================
pause

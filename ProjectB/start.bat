@echo off
echo ========================================
echo 智慧健康监测平台 - 启动脚本
echo ========================================

echo.
echo [1/6] 检查环境...
where docker >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Docker，请先安装并启动Docker Desktop
    pause
    exit /b 1
)

echo.
echo [2/6] 检查MySQL容器...
docker ps --filter "name=mysql8" --format "{{.Names}}" | findstr "mysql8" >nul
if errorlevel 1 (
    echo MySQL容器未运行，正在启动...
    docker start mysql8
    timeout /t 5 /nobreak >nul
) else (
    echo MySQL容器已运行
)

echo.
echo [3/6] 检查数据库...
docker exec mysql8 mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS health_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if errorlevel 1 (
    echo 警告: 数据库检查失败，请确保MySQL容器正常运行
) else (
    echo 数据库检查完成
)

echo.
echo [4/6] 配置后端...
cd /d "%~dp0backend"

echo 检查虚拟环境...
if not exist "venv\Scripts\python.exe" (
    echo 错误: 未找到虚拟环境，请先创建虚拟环境
    echo 运行: py -m venv venv
    pause
    exit /b 1
)

echo 激活虚拟环境...
call venv\Scripts\activate.bat

echo 安装依赖...
pip install -r requirements.txt --quiet

echo.
echo [5/6] 初始化数据库...
python run_migrations.py

echo.
echo 创建默认用户...
python create_superuser.py

echo.
echo [6/6] 配置前端...
cd /d "%~dp0frontend"

echo 配置npm缓存目录...
if not exist "node_cache" mkdir node_cache
npm config set cache "%~dp0frontend\node_cache"

echo.
echo ========================================
echo 配置完成！
echo ========================================
echo.
echo 数据库信息:
echo   主机: 127.0.0.1
echo   端口: 3307
echo   用户名: root
echo   密码: root
echo   数据库: health_platform
echo.
echo 后端启动方式:
echo   cd backend
echo   venv\Scripts\activate.bat
echo   python manage.py runserver
echo   后端地址: http://localhost:8000
echo   管理后台: http://localhost:8000/admin
echo.
echo 前端启动方式:
echo   cd frontend
echo   npm install
echo   npm run dev
echo   前端地址: http://localhost:3000
echo.
echo 测试账号:
echo   管理员: admin / admin123456
echo   普通用户: testuser / test123456
echo.
echo ========================================
pause

@echo off
chcp 65001 >nul
title Railway配置检查

echo ========================================
echo 🔍 Railway配置检查 - 网站访问统计系统
echo ========================================
echo.

echo 📋 检查Railway部署配置...
echo.

REM 检查Railway CLI
echo 🔍 检查Railway CLI...
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI未安装
    echo.
    echo 请先安装Railway CLI：
    echo npm install -g @railway/cli
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Railway CLI已安装
)

echo.
echo 🔍 检查登录状态...
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未登录Railway
    echo.
    echo 请先登录：
    echo railway login
    echo.
    pause
    exit /b 1
) else (
    echo ✅ 已登录Railway
)

echo.
echo 🔍 检查项目配置...
if exist .railway (
    echo ✅ 项目已初始化
    echo.
    echo 📁 项目ID: 
    railway status --json | findstr "projectId"
) else (
    echo ❌ 项目未初始化
    echo.
    echo 请先初始化项目：
    echo railway init
    echo.
    pause
    exit /b 1
)

echo.
echo 🔍 检查环境变量...
echo.
echo 在Railway Dashboard中，请确保设置了以下环境变量：
echo.
echo 🗄️  数据库配置 (MySQL服务自动提供)：
echo    DB_HOST=${MYSQLHOST}
echo    DB_USER=${MYSQLUSER}
echo    DB_PASSWORD=${MYSQLPASSWORD}
echo    DB_NAME=${MYSQLDATABASE}
echo    DB_PORT=${MYSQLPORT}
echo.
echo 🌐 服务器配置：
echo    PORT=${PORT}
echo    NODE_ENV=production
echo.
echo 🔒 安全配置：
echo    RATE_LIMIT_WINDOW_MS=900000
echo    RATE_LIMIT_MAX_REQUESTS=100
echo    ADMIN_API_KEY=your_secret_key_here
echo.

echo 📋 配置检查清单：
echo.
echo ✅ 1. Railway CLI已安装
echo ✅ 2. 已登录Railway账户
echo ✅ 3. 项目已初始化
echo.
echo ⚠️  4. 请在Railway Dashboard中设置环境变量
echo ⚠️  5. 确保MySQL服务已创建并连接
echo.

echo 按任意键查看当前服务状态...
pause >nul

echo.
echo 🔍 当前服务状态：
railway status

echo.
echo 🗄️  数据库服务状态：
railway service list

echo.
echo 如果看到MySQL服务，说明配置正确！
echo 现在可以运行 railway up 进行部署
echo.

pause

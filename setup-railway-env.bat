@echo off
chcp 65001 >nul
title Railway环境变量配置

echo ========================================
echo 🔧 Railway环境变量配置工具
echo ========================================
echo.

echo 📋 这个脚本将帮助您配置Railway环境变量
echo.

echo 🔍 检查Railway CLI...
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI未安装
    echo 请先运行 railway-deploy.bat 安装Railway CLI
    pause
    exit /b 1
)

echo ✅ Railway CLI已安装
echo.

echo 🔍 检查登录状态...
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未登录Railway
    echo 请先登录: railway login
    pause
    exit /b 1
)

echo ✅ 已登录Railway
echo.

echo 📝 配置环境变量...
echo.

echo 设置基本环境变量...
railway variables set NODE_ENV=production
railway variables set TZ=Asia/Shanghai

echo 设置安全配置...
railway variables set ADMIN_API_KEY=EpZRllhApFMUenjfLOyXSilDPHFyGbPg
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=100

echo.
echo 🗄️  数据库环境变量说明：
echo.
echo Railway MySQL服务会自动提供以下环境变量：
echo - MYSQLHOST (数据库主机)
echo - MYSQLUSER (数据库用户)
echo - MYSQLPASSWORD (数据库密码)
echo - MYSQLDATABASE (数据库名称)
echo - MYSQLPORT (数据库端口)
echo.
echo 我们需要将这些映射到我们的应用变量：
echo.

echo 设置数据库连接变量...
railway variables set DB_HOST=\${MYSQLHOST}
railway variables set DB_USER=\${MYSQLUSER}
railway variables set DB_PASSWORD=\${MYSQLPASSWORD}
railway variables set DB_NAME=\${MYSQLDATABASE}
railway variables set DB_PORT=\${MYSQLPORT}

echo.
echo ✅ 环境变量配置完成！
echo.

echo 📋 当前环境变量列表：
railway variables

echo.
echo 🎯 下一步：
echo 1. 确保已添加MySQL数据库服务
echo 2. 运行 railway up 部署应用
echo 3. 检查部署日志
echo.

pause

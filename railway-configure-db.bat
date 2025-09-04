@echo off
chcp 65001 >nul
title Railway数据库配置

echo ========================================
echo 🗄️  Railway数据库配置助手
echo ========================================
echo.

echo 📋 这个脚本将帮助您配置Railway数据库连接
echo.

echo 🔍 检查Railway CLI...
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI未安装
    echo 请先安装: npm install -g @railway/cli
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

echo 📋 数据库配置步骤：
echo.
echo 1. 在Railway Dashboard中连接MySQL服务到应用
echo 2. 设置环境变量
echo 3. 重启服务
echo.

echo 🔍 当前服务状态：
railway status

echo.
echo 🗄️  可用服务：
railway service list

echo.
echo 📋 手动配置步骤：
echo.
echo 1. 打开Railway Dashboard
echo 2. 找到您的应用服务
echo 3. 点击"Connect"按钮
echo 4. 选择MySQL服务
echo 5. 在Variables中添加以下环境变量：
echo.
echo    DB_HOST=${MYSQLHOST}
echo    DB_USER=${MYSQLUSER}
echo    DB_PASSWORD=${MYSQLPASSWORD}
echo    DB_NAME=${MYSQLDATABASE}
echo    DB_PORT=${MYSQLPORT}
echo    NODE_ENV=production
echo    RATE_LIMIT_WINDOW_MS=900000
echo    RATE_LIMIT_MAX_REQUESTS=100
echo    ADMIN_API_KEY=EpZRllhApFMUenjfLOyXSilDPHFyGbPg
echo    TZ=Asia/Shanghai
echo.

echo ⚠️  重要提示：
echo - 确保MySQL服务已创建
echo - 确保应用服务已创建
echo - 使用Connect功能连接两个服务
echo - 环境变量会自动生成
echo.

echo 按任意键查看详细配置说明...
pause >nul

echo.
echo 📖 详细配置说明：
echo.
echo 🗄️  MySQL服务配置：
echo 1. 在Railway Dashboard中创建MySQL服务
echo 2. 等待服务启动完成
echo 3. 记录服务名称
echo.
echo 🔗 连接服务：
echo 1. 在应用服务页面点击"Connect"
echo 2. 选择MySQL服务
echo 3. Railway会自动生成连接变量
echo.
echo ⚙️  环境变量配置：
echo 1. 在应用服务的Variables标签页
echo 2. 添加上述环境变量
echo 3. 使用${MYSQLHOST}等引用MySQL服务变量
echo.
echo 🚀 重启服务：
echo 1. 配置完成后重启应用服务
echo 2. 检查日志确认连接成功
echo 3. 访问/health端点验证
echo.

echo 🎯 快速配置命令：
echo.
echo # 查看服务列表
echo railway service list
echo.
echo # 查看环境变量
echo railway variables
echo.
echo # 重启服务
echo railway restart
echo.
echo # 查看日志
echo railway logs
echo.

pause

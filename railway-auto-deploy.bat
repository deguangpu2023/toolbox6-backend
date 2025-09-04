@echo off
chcp 65001 >nul
title Railway自动部署

echo ========================================
echo 🚀 Railway自动部署 - 网站访问统计系统
echo ========================================
echo.

echo 📋 这个脚本将自动完成Railway部署的所有步骤
echo.

echo 🔍 检查环境...
echo.

REM 检查Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js未安装
    echo 请先安装Node.js: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✅ Node.js已安装
)

REM 检查npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm未安装
    pause
    exit /b 1
) else (
    echo ✅ npm已安装
)

REM 检查Railway CLI
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI未安装
    echo.
    echo 正在安装Railway CLI...
    npm install -g @railway/cli
    if %errorlevel% neq 0 (
        echo ❌ Railway CLI安装失败
        pause
        exit /b 1
    )
    echo ✅ Railway CLI安装成功
) else (
    echo ✅ Railway CLI已安装
)

echo.
echo 🔍 检查登录状态...
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未登录Railway
    echo.
    echo 请在弹出的浏览器中登录Railway账户...
    railway login
    if %errorlevel% neq 0 (
        echo ❌ 登录失败
        pause
        exit /b 1
    )
    echo ✅ 登录成功
) else (
    echo ✅ 已登录Railway
)

echo.
echo 📁 当前工作目录: %CD%
echo.

echo 🚀 开始部署流程...
echo.

REM 检查是否已初始化
if not exist .railway (
    echo 📝 初始化Railway项目...
    railway init
    if %errorlevel% neq 0 (
        echo ❌ 项目初始化失败
        pause
        exit /b 1
    )
    echo ✅ 项目初始化成功
) else (
    echo ✅ 项目已初始化
)

echo.
echo 📦 安装依赖...
npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装成功

echo.
echo 🗄️  数据库配置说明：
echo.
echo ✅ 您已在Railway创建了MySQL数据库
echo.
echo 📋 请在Railway Dashboard中设置以下环境变量：
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
echo 📍 设置位置：Railway Dashboard → 您的项目 → Variables
echo.

echo 按任意键继续部署...
pause >nul

echo.
echo 🚀 部署到Railway...
railway up

if %errorlevel% neq 0 (
    echo.
    echo ❌ 部署失败！
    echo 请检查错误信息并重试
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ 部署成功！
echo.
echo 📍 获取服务信息：
echo railway status
echo.
echo 🔧 查看日志：
echo railway logs
echo.
echo 🌐 访问应用：
echo 在Railway Dashboard中查看服务URL
echo.

echo 🎉 部署完成！
echo.
echo 📋 下一步操作：
echo 1. 在Railway Dashboard中设置环境变量
echo 2. 确保MySQL服务已连接
echo 3. 重启服务以应用新配置
echo 4. 访问 /health 端点检查健康状态
echo.

pause

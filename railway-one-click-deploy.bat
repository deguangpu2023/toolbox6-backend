@echo off
chcp 65001 >nul
title Railway一键部署 - 访问统计后端

echo ========================================
echo 🚀 Railway一键部署 - 访问统计后端系统
echo ========================================
echo.

echo 📋 这个脚本将完成从零到部署的所有步骤
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
echo 🔧 配置环境变量...
railway variables set NODE_ENV=production
railway variables set TZ=Asia/Shanghai
railway variables set ADMIN_API_KEY=EpZRllhApFMUenjfLOyXSilDPHFyGbPg
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=100

echo 设置数据库连接变量...
railway variables set DB_HOST=\${MYSQLHOST}
railway variables set DB_USER=\${MYSQLUSER}
railway variables set DB_PASSWORD=\${MYSQLPASSWORD}
railway variables set DB_NAME=\${MYSQLDATABASE}
railway variables set DB_PORT=\${MYSQLPORT}

echo ✅ 环境变量配置完成

echo.
echo 🗄️  重要提示：
echo.
echo 1. 请在Railway Dashboard中添加MySQL数据库服务
echo 2. 数据库表将在首次启动时自动创建
echo 3. 部署完成后，请记录您的API URL
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

echo 📍 获取服务信息...
railway status

echo.
echo 🔧 查看日志...
railway logs --tail 20

echo.
echo 🌐 获取应用URL...
for /f "tokens=*" %%i in ('railway domain') do set RAILWAY_URL=%%i
echo 您的API地址: %RAILWAY_URL%

echo.
echo 🎉 部署完成！
echo.
echo 📋 下一步操作：
echo 1. 在Railway Dashboard中添加MySQL数据库服务
echo 2. 等待数据库服务启动
echo 3. 重启应用服务以连接数据库
echo 4. 测试API接口: %RAILWAY_URL%/health
echo 5. 更新前端配置指向: %RAILWAY_URL%
echo.

echo 📊 API接口列表：
echo - 健康检查: %RAILWAY_URL%/health
echo - 记录访问: POST %RAILWAY_URL%/api/visit
echo - 页面统计: GET %RAILWAY_URL%/api/stats/page/:pageUrl
echo - 总体统计: GET %RAILWAY_URL%/api/stats/overall
echo - 热门页面: GET %RAILWAY_URL%/api/stats/top-pages
echo - 访问趋势: GET %RAILWAY_URL%/api/stats/trend
echo.

pause

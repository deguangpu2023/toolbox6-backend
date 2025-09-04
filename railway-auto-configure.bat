@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 Railway自动配置脚本
echo ========================================
echo.

echo 🔍 检查Railway CLI状态...
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI未安装，请先安装
    echo 安装命令: npm install -g @railway/cli
    pause
    exit /b 1
)

echo ✅ Railway CLI已安装
echo.

echo 🔐 检查登录状态...
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未登录Railway，请先登录
    echo 登录命令: railway login
    pause
    exit /b 1
)

echo ✅ 已登录Railway
echo.

echo 📋 设置环境变量...
echo 正在设置数据库连接配置...

railway variables set DB_HOST=mysql.railway.internal
railway variables set DB_USER=root
railway variables set DB_PASSWORD=EpZRllhApFMUenjfLOyXSilDPHFyGbPg
railway variables set DB_NAME=railway
railway variables set DB_PORT=3306
railway variables set NODE_ENV=production
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=100
railway variables set ADMIN_API_KEY=EpZRllhApFMUenjfLOyXSilDPHFyGbPg

echo.
echo ✅ 环境变量设置完成！
echo.

echo 🔄 重启应用服务...
railway restart

echo.
echo ✅ 配置完成！
echo.
echo 📊 验证步骤:
echo 1. 等待服务重启完成 (约1-2分钟)
echo 2. 访问健康检查: https://your-app.railway.app/health
echo 3. 查看日志: railway logs
echo.

echo 🎉 Railway数据库配置完成！
echo 您的应用现在应该能够正常连接数据库了。
echo.
pause

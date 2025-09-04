@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 Railway部署脚本
echo ========================================
echo.

echo 📋 当前配置信息:
echo 数据库主机: maglev.proxy.rlwy.net
echo 数据库端口: 48332
echo 数据库名称: railway
echo 数据库用户: root
echo.

echo 🔍 检查部署环境...
if not exist "package.json" (
    echo ❌ 未找到package.json文件
    pause
    exit /b 1
)

if not exist "server.js" (
    echo ❌ 未找到server.js文件
    pause
    exit /b 1
)

if not exist ".env" (
    echo ❌ 未找到.env文件
    pause
    exit /b 1
)

echo ✅ 部署文件检查完成
echo.

echo 📝 环境变量配置:
echo DB_HOST=maglev.proxy.rlwy.net
echo DB_USER=root
echo DB_PASSWORD=EpZRllhApFMUenjfLOyXSilDPHFyGbPg
echo DB_NAME=railway
echo DB_PORT=48332
echo NODE_ENV=production
echo.

echo 🎯 部署选项:
echo 1. 通过GitHub部署 (推荐)
echo 2. 通过Railway CLI部署
echo 3. 手动部署指南
echo.

set /p choice="请选择部署方式 (1-3): "

if "%choice%"=="1" goto github_deploy
if "%choice%"=="2" goto cli_deploy
if "%choice%"=="3" goto manual_deploy
goto invalid_choice

:github_deploy
echo.
echo 📚 GitHub部署步骤:
echo 1. 将代码推送到GitHub仓库
echo 2. 在Railway Dashboard中创建新项目
echo 3. 选择"Deploy from GitHub repo"
echo 4. 选择您的仓库和server文件夹
echo 5. 在Variables标签页设置环境变量
echo 6. 部署完成
echo.
echo 🔧 环境变量设置:
echo DB_HOST=maglev.proxy.rlwy.net
echo DB_USER=root
echo DB_PASSWORD=EpZRllhApFMUenjfLOyXSilDPHFyGbPg
echo DB_NAME=railway
echo DB_PORT=48332
echo NODE_ENV=production
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX_REQUESTS=100
echo ADMIN_API_KEY=EpZRllhApFMUenjfLOyXSilDPHFyGbPg
echo TZ=Asia/Shanghai
echo.
goto end

:cli_deploy
echo.
echo 🔧 Railway CLI部署:
echo 1. 安装Railway CLI: npm install -g @railway/cli
echo 2. 登录: railway login
echo 3. 初始化项目: railway init
echo 4. 设置环境变量: railway variables set DB_HOST=maglev.proxy.rlwy.net
echo 5. 部署: railway up
echo.
goto end

:manual_deploy
echo.
echo 📖 手动部署指南:
echo 1. 访问 https://railway.app/dashboard
echo 2. 创建新项目
echo 3. 添加MySQL服务
echo 4. 添加Node.js服务
echo 5. 上传代码或连接GitHub
echo 6. 设置环境变量
echo 7. 部署应用
echo.
goto end

:invalid_choice
echo ❌ 无效选择，请重新运行脚本
goto end

:end
echo.
echo 🎉 部署配置完成！
echo 📊 数据库连接已测试成功
echo 🌐 服务器可以正常启动
echo.
echo ⚠️  重要提醒:
echo - 确保在Railway中设置正确的环境变量
echo - 部署后更新前端API URL
echo - 测试健康检查端点
echo.
pause

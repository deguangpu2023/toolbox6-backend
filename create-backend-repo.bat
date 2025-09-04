@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 创建独立Backend仓库脚本
echo ========================================
echo.

echo 📋 此脚本将帮助您创建独立的backend仓库用于Railway部署
echo.

echo 🔍 检查当前环境...
if not exist "package.json" (
    echo ❌ 未找到package.json文件，请确保在server目录中运行此脚本
    pause
    exit /b 1
)

if not exist "server.js" (
    echo ❌ 未找到server.js文件，请确保在server目录中运行此脚本
    pause
    exit /b 1
)

echo ✅ 环境检查完成
echo.

echo 📝 请按照以下步骤操作：
echo.
echo 1. 在GitHub上创建新仓库：
echo    - 仓库名：toolbox6-backend 或 toolbox-visitor-counter
echo    - 设置为公开或私有
echo    - 不要初始化README、.gitignore或license
echo.
echo 2. 复制仓库URL（类似：https://github.com/yourusername/toolbox6-backend.git）
echo.

set /p repo_url="请输入新仓库的Git URL: "

if "%repo_url%"=="" (
    echo ❌ 仓库URL不能为空
    pause
    exit /b 1
)

echo.
echo 🔧 初始化Git仓库...
git init
if %errorlevel% neq 0 (
    echo ❌ Git初始化失败
    pause
    exit /b 1
)

echo.
echo 📦 添加文件到Git...
git add .
if %errorlevel% neq 0 (
    echo ❌ 添加文件失败
    pause
    exit /b 1
)

echo.
echo 💾 提交代码...
git commit -m "Initial backend commit for Railway deployment"
if %errorlevel% neq 0 (
    echo ❌ 提交失败
    pause
    exit /b 1
)

echo.
echo 🌿 设置主分支...
git branch -M main
if %errorlevel% neq 0 (
    echo ❌ 设置主分支失败
    pause
    exit /b 1
)

echo.
echo 🔗 添加远程仓库...
git remote add origin %repo_url%
if %errorlevel% neq 0 (
    echo ❌ 添加远程仓库失败
    pause
    exit /b 1
)

echo.
echo 🚀 推送到GitHub...
git push -u origin main
if %errorlevel% neq 0 (
    echo ❌ 推送失败，请检查仓库URL和权限
    pause
    exit /b 1
)

echo.
echo ✅ 独立backend仓库创建成功！
echo.
echo 🎯 下一步操作：
echo 1. 在Railway Dashboard中创建新项目
echo 2. 选择"Deploy from GitHub repo"
echo 3. 选择刚创建的backend仓库
echo 4. 设置环境变量
echo 5. 部署应用
echo.
echo 📋 环境变量配置：
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
pause

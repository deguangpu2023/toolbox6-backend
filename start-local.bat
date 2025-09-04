@echo off
chcp 65001 >nul
echo ========================================
echo 🏠 本地开发环境启动脚本
echo ========================================
echo.

echo 🔍 检查本地环境...
if not exist ".env.local" (
    echo ❌ 未找到 .env.local 文件
    echo 📝 正在创建本地配置文件...
    node local-dev-config.js
    echo.
    echo ⚠️  请编辑 .env.local 文件，设置您的本地MySQL数据库密码
    echo 然后重新运行此脚本
    pause
    exit /b 1
)

echo ✅ 找到本地配置文件
echo.

echo 🔄 复制本地配置到 .env...
copy ".env.local" ".env" >nul
if %errorlevel% neq 0 (
    echo ❌ 复制配置文件失败
    pause
    exit /b 1
)

echo ✅ 配置文件已复制
echo.

echo 🚀 启动本地开发服务器...
echo 📍 服务地址: http://localhost:3001
echo 📊 健康检查: http://localhost:3001/health
echo ⏹️  按Ctrl+C停止服务器
echo.

npm start

@echo off
chcp 65001 >nul
title 智能启动 - 网站访问统计系统

echo ========================================
echo 🚀 智能启动 - 网站访问统计系统
echo ========================================
echo.

echo 📁 当前工作目录: %CD%
echo.

REM 检查package.json
if not exist package.json (
    echo ❌ 未找到package.json文件
    echo    请确保在正确的目录中运行此脚本
    echo.
    pause
    exit /b 1
)

echo ✅ 找到package.json文件
echo.

REM 检查依赖是否已安装
if not exist node_modules (
    echo 📦 依赖未安装，正在自动安装...
    echo.
    
    REM 设置npm镜像
    npm config set registry https://registry.npmmirror.com
    
    REM 安装依赖
    npm install
    
    if %errorlevel% neq 0 (
        echo.
        echo ❌ 依赖安装失败！
        echo 请手动运行 install-deps.bat 或检查网络连接
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo ✅ 依赖安装成功！
    echo.
) else (
    echo ✅ 依赖已安装
    echo.
)

REM 检查.env文件
if not exist .env (
    echo 📝 环境配置文件不存在，正在创建...
    if exist env.example (
        copy env.example .env >nul 2>&1
        echo ✅ 已复制env.example为.env
        echo ⚠️  请编辑.env文件，配置数据库连接信息
        echo.
    ) else (
        echo ❌ 未找到env.example文件
        pause
        exit /b 1
    )
) else (
    echo ✅ 环境配置文件已存在
    echo.
)

echo ========================================
echo 🌐 启动访问统计服务器
echo ========================================
echo 📍 服务地址: http://localhost:3001
echo 📊 健康检查: http://localhost:3001/health
echo ⏹️  按Ctrl+C停止服务器
echo.

REM 启动服务器
echo 🚀 正在启动服务器...
npm start

echo.
echo ⚠️  服务器已停止运行
echo.
pause

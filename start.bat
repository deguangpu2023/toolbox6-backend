@echo off
chcp 65001 >nul
title 网站访问统计系统启动脚本

echo ========================================
echo 🚀 网站访问统计系统启动脚本
echo ========================================
echo.

REM 设置错误处理
setlocal enabledelayedexpansion

REM 检查当前目录
echo 📁 当前工作目录: %CD%
echo.

REM 检查Node.js是否安装
echo 🔍 检查Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js未安装或不在PATH中
    echo    请先安装Node.js 18+
    echo    下载地址: https://nodejs.org/
    echo.
    echo 按任意键退出...
    pause >nul
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js版本: !NODE_VERSION!
)

REM 检查npm是否安装
echo 🔍 检查npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm未安装或不在PATH中
    echo.
    echo 按任意键退出...
    pause >nul
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm版本: !NPM_VERSION!
)

echo.
echo ✅ Node.js和npm检查通过
echo.

REM 检查package.json文件
echo 🔍 检查package.json...
if not exist package.json (
    echo ❌ 未找到package.json文件
    echo    请确保在正确的目录中运行此脚本
    echo.
    echo 按任意键退出...
    pause >nul
    exit /b 1
) else (
    echo ✅ 找到package.json文件
)

REM 检查环境变量文件
echo 🔍 检查环境配置文件...
if not exist .env (
    echo 📝 创建环境变量配置文件...
    if exist env.example (
        copy env.example .env >nul 2>&1
        if %errorlevel% neq 0 (
            echo ❌ 复制env.example失败
            echo.
            echo 按任意键退出...
            pause >nul
            exit /b 1
        )
        echo ✅ 已复制env.example为.env
        echo ⚠️  请编辑.env文件，配置数据库连接信息
        echo.
    ) else (
        echo ❌ 未找到env.example文件
        echo    请确保env.example文件存在
        echo.
        echo 按任意键退出...
        pause >nul
        exit /b 1
    )
) else (
    echo ✅ 找到.env配置文件
)

REM 安装依赖
echo 📦 安装依赖包...
if not exist node_modules (
    echo 🔄 正在安装依赖，请稍候...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        echo    请检查网络连接和npm配置
        echo.
        echo 按任意键退出...
        pause >nul
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已安装
)

echo.
echo ========================================
echo 🌐 准备启动访问统计服务器
echo ========================================
echo 📍 服务地址: http://localhost:3001
echo 📊 健康检查: http://localhost:3001/health
echo ⏹️  按Ctrl+C停止服务器
echo.

REM 启动服务器前的确认
echo 按任意键启动服务器...
pause >nul

echo.
echo 🚀 正在启动服务器...
echo.

REM 启动服务器
npm start

REM 如果服务器正常退出，显示信息
echo.
echo ⚠️  服务器已停止运行
echo.
echo 按任意键退出...
pause >nul

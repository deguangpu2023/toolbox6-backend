@echo off
chcp 65001 >nul
title Railway部署脚本

echo ========================================
echo 🚀 Railway部署 - 网站访问统计系统
echo ========================================
echo.

echo 📋 部署前准备：
echo 1. 确保已安装Railway CLI
echo 2. 确保已登录Railway账户
echo 3. 确保项目已连接到Railway
echo.

echo 🔍 检查Railway CLI...
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI未安装
    echo.
    echo 请先安装Railway CLI：
    echo npm install -g @railway/cli
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Railway CLI已安装
)

echo.
echo 🔍 检查登录状态...
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未登录Railway
    echo.
    echo 请先登录：
    echo railway login
    echo.
    pause
    exit /b 1
) else (
    echo ✅ 已登录Railway
)

echo.
echo 📁 当前工作目录: %CD%
echo.

echo 🚀 开始部署到Railway...
echo.

REM 部署到Railway
railway up

if %errorlevel% neq 0 (
    echo.
    echo ❌ 部署失败！
    echo 请检查错误信息并重试
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ 部署成功！
    echo.
    echo 📍 获取服务URL：
    echo railway status
    echo.
    echo 🔧 查看日志：
    echo railway logs
    echo.
)

pause

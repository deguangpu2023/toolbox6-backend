@echo off
chcp 65001 >nul
title 安装依赖包

echo ========================================
echo 📦 安装网站访问统计系统依赖包
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

REM 清除旧的node_modules（如果存在）
if exist node_modules (
    echo 🗑️  删除旧的依赖目录...
    rmdir /s /q node_modules
    if %errorlevel% neq 0 (
        echo ⚠️  删除node_modules失败，继续安装...
    ) else (
        echo ✅ 已删除旧的依赖目录
    )
    echo.
)

REM 清除npm缓存
echo 🧹 清除npm缓存...
npm cache clean --force
if %errorlevel% neq 0 (
    echo ⚠️  清除缓存失败，继续安装...
) else (
    echo ✅ npm缓存已清除
)
echo.

REM 设置npm镜像（可选，提高下载速度）
echo 🔄 设置npm镜像源...
npm config set registry https://registry.npmmirror.com
echo ✅ 已设置npm镜像源
echo.

REM 安装依赖
echo 📦 开始安装依赖包...
echo 这可能需要几分钟时间，请耐心等待...
echo.

npm install

if %errorlevel% neq 0 (
    echo.
    echo ❌ 依赖安装失败！
    echo.
    echo 可能的原因：
    echo 1. 网络连接问题
    echo 2. Node.js版本不兼容
    echo 3. npm配置问题
    echo.
    echo 建议：
    echo 1. 检查网络连接
    echo 2. 尝试使用VPN或代理
    echo 3. 检查Node.js版本（建议18+）
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ 依赖安装成功！
    echo.
    echo 现在可以运行 start.bat 启动服务器了
    echo.
)

pause

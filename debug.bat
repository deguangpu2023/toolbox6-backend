@echo off
chcp 65001 >nul
title 调试模式 - 网站访问统计系统

echo ========================================
echo 🔍 调试模式 - 网站访问统计系统
echo ========================================
echo.

echo 📁 当前工作目录: %CD%
echo.

echo 🔍 检查基本环境...
echo.

echo 1. 检查Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js检查失败
) else (
    echo ✅ Node.js检查通过
)
echo.

echo 2. 检查npm...
npm --version
if %errorlevel% neq 0 (
    echo ❌ npm检查失败
) else (
    echo ✅ npm检查通过
)
echo.

echo 3. 检查文件...
if exist package.json (
    echo ✅ 找到package.json
) else (
    echo ❌ 未找到package.json
)

if exist .env (
    echo ✅ 找到.env
) else (
    echo ❌ 未找到.env
)

if exist node_modules (
    echo ✅ 找到node_modules
) else (
    echo ❌ 未找到node_modules
)
echo.

echo 4. 尝试启动服务器...
echo 按任意键继续...
pause >nul

echo.
echo 🚀 启动服务器...
npm start

echo.
echo 服务器已退出，按任意键关闭窗口...
pause >nul

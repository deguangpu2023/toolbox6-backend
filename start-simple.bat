@echo off
chcp 65001 >nul
title 网站访问统计系统 - 简化启动

echo 🚀 网站访问统计系统启动中...
echo.

REM 直接启动，让错误自然显示
npm start

echo.
echo 服务器已停止，按任意键退出...
pause >nul

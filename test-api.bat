@echo off
chcp 65001 >nul
title API测试工具

echo ========================================
echo 🧪 Railway API测试工具
echo ========================================
echo.

echo 📋 这个脚本将测试部署的API服务
echo.

set /p API_URL="请输入您的Railway API地址 (例如: https://your-app.railway.app): "

if "%API_URL%"=="" (
    echo ❌ 请输入有效的API地址
    pause
    exit /b 1
)

echo.
echo 🔍 测试API服务...
echo.

echo 1. 测试健康检查...
curl -s "%API_URL%/health"
if %errorlevel% neq 0 (
    echo ❌ 健康检查失败
) else (
    echo ✅ 健康检查通过
)

echo.
echo 2. 测试API信息...
curl -s "%API_URL%/"
if %errorlevel% neq 0 (
    echo ❌ API信息获取失败
) else (
    echo ✅ API信息获取成功
)

echo.
echo 3. 测试记录访问...
curl -s -X POST "%API_URL%/api/visit" -H "Content-Type: application/json" -d "{\"pageUrl\":\"/test\"}"
if %errorlevel% neq 0 (
    echo ❌ 访问记录失败
) else (
    echo ✅ 访问记录成功
)

echo.
echo 4. 测试页面统计...
curl -s "%API_URL%/api/stats/page/test"
if %errorlevel% neq 0 (
    echo ❌ 页面统计获取失败
) else (
    echo ✅ 页面统计获取成功
)

echo.
echo 5. 测试总体统计...
curl -s "%API_URL%/api/stats/overall"
if %errorlevel% neq 0 (
    echo ❌ 总体统计获取失败
) else (
    echo ✅ 总体统计获取成功
)

echo.
echo 6. 测试热门页面...
curl -s "%API_URL%/api/stats/top-pages"
if %errorlevel% neq 0 (
    echo ❌ 热门页面获取失败
) else (
    echo ✅ 热门页面获取成功
)

echo.
echo 7. 测试访问趋势...
curl -s "%API_URL%/api/stats/trend"
if %errorlevel% neq 0 (
    echo ❌ 访问趋势获取失败
) else (
    echo ✅ 访问趋势获取成功
)

echo.
echo 🎉 API测试完成！
echo.

echo 📊 测试结果总结：
echo - 健康检查: %API_URL%/health
echo - API信息: %API_URL%/
echo - 记录访问: POST %API_URL%/api/visit
echo - 页面统计: GET %API_URL%/api/stats/page/:pageUrl
echo - 总体统计: GET %API_URL%/api/stats/overall
echo - 热门页面: GET %API_URL%/api/stats/top-pages
echo - 访问趋势: GET %API_URL%/api/stats/trend
echo.

echo 💡 提示：
echo 如果测试失败，请检查：
echo 1. API地址是否正确
echo 2. Railway服务是否正在运行
echo 3. 数据库是否已连接
echo 4. 环境变量是否正确设置
echo.

pause

@echo off
echo 🔍 全面测试统计功能
echo.

echo 📋 1. 测试时区调试...
curl "https://your-app.railway.app/api/debug/timezone"
echo.
echo.

echo 📋 2. 测试数据一致性检查...
curl -X POST "https://your-app.railway.app/api/debug/check-consistency"
echo.
echo.

echo 📋 3. 测试总体统计...
curl "https://your-app.railway.app/api/stats/overall"
echo.
echo.

echo 📋 4. 测试热门页面排行...
curl "https://your-app.railway.app/api/stats/top-pages?limit=5"
echo.
echo.

echo 📋 5. 测试访问趋势...
curl "https://your-app.railway.app/api/stats/trend?days=7"
echo.
echo.

echo 📋 6. 测试页面统计（首页）...
curl "https://your-app.railway.app/api/stats/page/home"
echo.
echo.

echo 📋 7. 测试健康检查...
curl "https://your-app.railway.app/health"
echo.
echo.

echo 📋 8. 测试数据库状态...
curl "https://your-app.railway.app/api/debug/database-status"
echo.
echo.

echo ✅ 统计功能全面测试完成！
echo.
echo 📝 检查要点：
echo 1. 时区信息是否正确
echo 2. 数据一致性是否有问题
echo 3. 总体统计数据是否准确
echo 4. 热门页面排行是否正常
echo 5. 访问趋势数据是否完整
echo 6. 页面统计是否准确
echo 7. 健康检查是否通过
echo 8. 数据库连接是否正常
echo.
pause

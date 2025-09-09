@echo off
echo 🕐 测试时区修复
echo.

echo 📋 测试时区调试接口...
curl "https://your-app.railway.app/api/debug/timezone"
echo.
echo.

echo 📋 测试总体统计（今日访问量）...
curl "https://your-app.railway.app/api/stats/overall"
echo.
echo.

echo 📋 测试访问趋势（最近7天）...
curl "https://your-app.railway.app/api/stats/trend?days=7"
echo.
echo.

echo 📋 测试健康检查...
curl "https://your-app.railway.app/health"
echo.
echo.

echo ✅ 时区测试完成！
echo.
echo 📝 检查要点：
echo 1. 时区调试接口显示Node.js和数据库时区是否一致
echo 2. 今日访问量是否正确显示
echo 3. 访问趋势数据是否按正确日期分组
echo 4. 过了0点后数据是否正常更新
echo.
pause

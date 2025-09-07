@echo off
echo 🔍 诊断留言API问题
echo.

echo 📋 测试数据库状态接口...
curl "https://your-app.railway.app/api/debug/database-status"
echo.
echo.

echo 📋 测试数据库修复接口...
curl -X POST "https://your-app.railway.app/api/debug/fix-database"
echo.
echo.

echo 📋 测试留言查看接口...
curl "https://your-app.railway.app/api/messages/view?page=1&limit=5"
echo.
echo.

echo 📋 测试留言统计接口...
curl "https://your-app.railway.app/api/messages/stats"
echo.
echo.

echo ✅ 诊断完成！
echo.
echo 📝 如果仍有问题，请检查Railway日志：
echo railway logs --tail
echo.
pause

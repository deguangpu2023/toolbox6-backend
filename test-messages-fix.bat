@echo off
echo 🔧 测试留言查看功能修复
echo.

echo 📋 测试API接口...
curl "https://your-app.railway.app/api/messages/view?page=1&limit=5"
echo.
echo.

echo 📋 测试页面访问...
curl -I "https://your-app.railway.app/messages"
echo.

echo 📋 测试留言统计...
curl "https://your-app.railway.app/api/messages/stats"
echo.
echo.

echo ✅ 测试完成！
echo.
echo 📝 如果仍有问题，请检查Railway日志：
echo railway logs --tail
echo.
pause

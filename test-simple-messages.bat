@echo off
echo 🧪 测试简单留言查看功能
echo.

echo 📋 测试简单留言查看接口...
curl "https://your-app.railway.app/api/messages/view?page=1&limit=5"
echo.
echo.

echo 📋 测试留言查看页面...
echo 访问: https://your-app.railway.app/messages
echo.

echo 📋 测试留言统计接口...
curl "https://your-app.railway.app/api/messages/stats"
echo.
echo.

echo ✅ 测试完成！
echo.
echo 📝 使用方法:
echo 1. 直接访问API: https://your-app.railway.app/api/messages/view
echo 2. 访问查看页面: https://your-app.railway.app/messages
echo 3. 使用curl命令查看留言
echo.
pause

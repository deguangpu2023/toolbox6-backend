@echo off
echo 🔧 测试前端修复
echo.

echo 📋 测试留言查看页面...
curl -I "https://your-app.railway.app/messages"
echo.

echo 📋 测试留言查看API...
curl "https://your-app.railway.app/api/messages/view?page=1&limit=5"
echo.
echo.

echo 📋 测试数据库状态...
curl "https://your-app.railway.app/api/debug/database-status"
echo.
echo.

echo ✅ 测试完成！
echo.
echo 📝 现在可以：
echo 1. 访问页面: https://your-app.railway.app/messages
echo 2. 按F12打开开发者工具查看Console
echo 3. 点击"测试API"按钮进行诊断
echo 4. 查看详细的错误信息
echo.
pause

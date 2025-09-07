@echo off
echo 🔧 修复Railway认证环境变量
echo.

echo 📋 当前环境变量状态:
echo ADMIN_TOKEN=%ADMIN_TOKEN%
echo NODE_ENV=%NODE_ENV%
echo.

echo 🚀 设置环境变量...
railway variables set ADMIN_TOKEN=admin123
railway variables set NODE_ENV=production

echo.
echo ✅ 环境变量设置完成
echo.
echo 🔄 重启服务...
railway up

echo.
echo 🎉 修复完成！现在可以测试认证功能了
echo.
echo 📝 测试命令:
echo curl -H "Authorization: Bearer admin123" "https://your-app.railway.app/api/debug/auth-test"
echo.
pause

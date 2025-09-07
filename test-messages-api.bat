@echo off
echo 🧪 测试留言API接口
echo.

echo 📋 测试环境变量设置...
echo ADMIN_TOKEN=%ADMIN_TOKEN%
echo NODE_ENV=%NODE_ENV%
echo.

echo 🔍 测试留言统计API...
curl -H "Authorization: Bearer admin123" "https://your-app.railway.app/api/messages/stats"
echo.
echo.

echo 🔍 测试留言列表API...
curl -H "Authorization: Bearer admin123" "https://your-app.railway.app/api/messages?page=1&limit=20"
echo.
echo.

echo 🔍 测试点赞统计API...
curl "https://your-app.railway.app/api/tools/likes/stats"
echo.
echo.

echo 🔍 测试点赞列表API...
curl -H "Authorization: Bearer admin123" "https://your-app.railway.app/api/admin/tool-likes?page=1&limit=20"
echo.
echo.

echo 🔍 测试访问记录API...
curl -H "Authorization: Bearer admin123" "https://your-app.railway.app/api/admin/visits?page=1&limit=20"
echo.
echo.

echo ✅ 测试完成！
echo.
echo 📝 如果看到500错误，请检查Railway日志：
echo railway logs --tail
echo.
pause

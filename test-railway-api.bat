@echo off
chcp 65001 >nul
title Railway API完整测试

echo ========================================
echo 🧪 Railway API完整测试工具
echo ========================================
echo.

echo 📋 测试目标: https://toolbox6-backend-production.up.railway.app
echo.

set API_URL=https://toolbox6-backend-production.up.railway.app

echo 🔍 开始测试API服务...
echo.

echo 1. 测试健康检查...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_URL%/health' -UseBasicParsing; Write-Host '✅ 健康检查通过 - 状态码:' $response.StatusCode; Write-Host '响应内容:' $response.Content } catch { Write-Host '❌ 健康检查失败:' $_.Exception.Message }"

echo.
echo 2. 测试API信息...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_URL%/' -UseBasicParsing; Write-Host '✅ API信息获取成功 - 状态码:' $response.StatusCode; Write-Host '响应内容:' $response.Content } catch { Write-Host '❌ API信息获取失败:' $_.Exception.Message }"

echo.
echo 3. 测试记录访问...
powershell -Command "try { $body = '{\"pageUrl\":\"/test-page\"}'; $response = Invoke-WebRequest -Uri '%API_URL%/api/visit' -Method POST -ContentType 'application/json' -Body $body -UseBasicParsing; Write-Host '✅ 访问记录成功 - 状态码:' $response.StatusCode; Write-Host '响应内容:' $response.Content } catch { Write-Host '❌ 访问记录失败:' $_.Exception.Message }"

echo.
echo 4. 测试页面统计...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_URL%/api/stats/page/test-page' -UseBasicParsing; Write-Host '✅ 页面统计获取成功 - 状态码:' $response.StatusCode; Write-Host '响应内容:' $response.Content } catch { Write-Host '❌ 页面统计获取失败:' $_.Exception.Message }"

echo.
echo 5. 测试总体统计...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_URL%/api/stats/overall' -UseBasicParsing; Write-Host '✅ 总体统计获取成功 - 状态码:' $response.StatusCode; Write-Host '响应内容:' $response.Content } catch { Write-Host '❌ 总体统计获取失败:' $_.Exception.Message }"

echo.
echo 6. 测试热门页面...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_URL%/api/stats/top-pages' -UseBasicParsing; Write-Host '✅ 热门页面获取成功 - 状态码:' $response.StatusCode; Write-Host '响应内容:' $response.Content } catch { Write-Host '❌ 热门页面获取失败:' $_.Exception.Message }"

echo.
echo 7. 测试访问趋势...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_URL%/api/stats/trend' -UseBasicParsing; Write-Host '✅ 访问趋势获取成功 - 状态码:' $response.StatusCode; Write-Host '响应内容:' $response.Content } catch { Write-Host '❌ 访问趋势获取失败:' $_.Exception.Message }"

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

echo 💡 前端配置已更新：
echo 生产环境API地址: %API_URL%
echo.

echo 🚀 下一步操作：
echo 1. 重新构建前端项目
echo 2. 部署前端到您的托管平台
echo 3. 测试前后端完整集成
echo.

pause


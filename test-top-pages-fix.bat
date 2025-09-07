@echo off
chcp 65001 >nul
title 测试热门页面接口修复

echo ========================================
echo 🧪 测试热门页面接口修复
echo ========================================
echo.

echo 📋 测试目标: https://toolbox6-backend-production.up.railway.app
echo.

set API_URL=https://toolbox6-backend-production.up.railway.app

echo 🔍 测试热门页面接口...
echo.

echo 1. 测试热门页面接口（默认limit=10）...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_URL%/api/stats/top-pages' -UseBasicParsing; Write-Host '✅ 热门页面接口正常 - 状态码:' $response.StatusCode; Write-Host '响应内容:' $response.Content } catch { Write-Host '❌ 热门页面接口失败:' $_.Exception.Message }"

echo.
echo 2. 测试热门页面接口（limit=5）...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_URL%/api/stats/top-pages?limit=5' -UseBasicParsing; Write-Host '✅ 热门页面接口正常 - 状态码:' $response.StatusCode; Write-Host '响应内容:' $response.Content } catch { Write-Host '❌ 热门页面接口失败:' $_.Exception.Message }"

echo.
echo 3. 测试热门页面接口（limit=1）...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_URL%/api/stats/top-pages?limit=1' -UseBasicParsing; Write-Host '✅ 热门页面接口正常 - 状态码:' $response.StatusCode; Write-Host '响应内容:' $response.Content } catch { Write-Host '❌ 热门页面接口失败:' $_.Exception.Message }"

echo.
echo 4. 测试热门页面接口（无效limit）...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_URL%/api/stats/top-pages?limit=abc' -UseBasicParsing; Write-Host '✅ 热门页面接口正常 - 状态码:' $response.StatusCode; Write-Host '响应内容:' $response.Content } catch { Write-Host '❌ 热门页面接口失败:' $_.Exception.Message }"

echo.
echo 5. 测试热门页面接口（超大limit）...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_URL%/api/stats/top-pages?limit=1000' -UseBasicParsing; Write-Host '✅ 热门页面接口正常 - 状态码:' $response.StatusCode; Write-Host '响应内容:' $response.Content } catch { Write-Host '❌ 热门页面接口失败:' $_.Exception.Message }"

echo.
echo 🎉 热门页面接口测试完成！
echo.

echo 📊 测试结果说明：
echo - 如果所有测试都返回200状态码，说明修复成功
echo - 如果返回空数组[]，说明当前没有访问数据，这是正常的
echo - 如果仍然返回500错误，说明需要进一步调试
echo.

echo 💡 修复内容：
echo - 改进了错误处理，避免500错误
echo - 添加了数据验证和类型转换
echo - 确保在没有数据时返回空数组
echo - 修复了数据类型不一致问题
echo.

pause

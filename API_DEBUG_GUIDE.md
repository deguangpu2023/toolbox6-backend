# 🔧 API调试指南

## 问题：管理API返回500错误

### 🔍 问题分析
- ✅ 数据库连接正常
- ✅ 表已存在（messages, tool_likes）
- ✅ 认证成功
- ❌ 管理API接口返回500错误

### 🛠️ 调试步骤

#### 1. 查看Railway日志
```bash
railway logs --tail
```

现在应该能看到详细的API调用日志，包括：
- 请求头信息
- 认证状态
- 数据库连接状态
- SQL查询执行情况
- 详细的错误信息

#### 2. 测试单个API接口

**测试留言API：**
```bash
curl -H "Authorization: Bearer admin123" \
  "https://your-app.railway.app/api/messages?page=1&limit=20"
```

**测试访问记录API：**
```bash
curl -H "Authorization: Bearer admin123" \
  "https://your-app.railway.app/api/admin/visits?page=1&limit=20"
```

**测试点赞记录API：**
```bash
curl -H "Authorization: Bearer admin123" \
  "https://your-app.railway.app/api/admin/tool-likes?page=1&limit=20"
```

#### 3. 检查数据库连接

访问数据库状态接口：
```
GET https://your-app.railway.app/api/debug/database-status
```

#### 4. 使用浏览器开发者工具

1. 打开管理后台页面
2. 按F12打开开发者工具
3. 在Console中执行：

```javascript
// 测试留言API
fetch('/api/messages?page=1&limit=20', {
  headers: { 'Authorization': 'Bearer admin123' }
})
.then(response => {
  console.log('响应状态:', response.status);
  return response.json();
})
.then(data => console.log('响应数据:', data))
.catch(error => console.error('错误:', error));
```

### 🔧 常见问题及解决方案

#### 问题1：数据库连接池问题
**症状：** `❌ 获取数据库连接失败`

**解决方案：**
1. 检查Railway MySQL插件状态
2. 重启Railway服务
3. 检查环境变量设置

#### 问题2：SQL查询错误
**症状：** `❌ 执行留言查询失败`

**解决方案：**
1. 检查表结构是否正确
2. 确认字段名称和类型
3. 检查SQL语法

#### 问题3：认证问题
**症状：** `❌ 认证失败`

**解决方案：**
1. 确认令牌格式正确
2. 检查环境变量ADMIN_TOKEN
3. 重新登录管理后台

### 📊 调试接口

#### 1. 健康检查
```
GET /health
```

#### 2. 数据库状态
```
GET /api/debug/database-status
```

#### 3. 认证测试
```
GET /api/debug/auth-test
```

#### 4. 数据库修复
```
POST /api/debug/fix-database
```

### 🚀 快速修复

#### 方法1：重启服务
在Railway Dashboard中重启服务。

#### 方法2：重新部署
```bash
git add .
git commit -m "Fix API 500 errors - add detailed logging and error handling"
git push origin main
```

#### 方法3：检查环境变量
确认Railway环境变量设置：
```bash
ADMIN_TOKEN=admin123
NODE_ENV=production
```

### 📋 检查清单

- [ ] Railway日志显示详细错误信息
- [ ] 数据库连接正常
- [ ] 表结构正确
- [ ] 认证令牌正确
- [ ] API接口响应正常

### 🔍 日志分析

现在Railway日志应该显示类似以下信息：

**正常情况：**
```
🔍 获取留言列表请求
认证头: 已提供
期望令牌: Bearer admin123
✅ 数据库连接获取成功
🔍 执行留言查询...
📊 查询到 0 条留言记录
🔍 执行计数查询...
📈 总留言数: 0
✅ 获取到 0 条留言，总计 0 条
✅ 数据库连接已释放
```

**错误情况：**
```
🔍 获取留言列表请求
❌ 获取数据库连接失败: Error: Connection lost
错误详情: {
  message: "Connection lost",
  code: "PROTOCOL_CONNECTION_LOST",
  errno: -4077
}
```

### 📞 获取帮助

如果问题仍然存在：

1. **查看详细日志** - 通过Railway Dashboard获取完整日志
2. **测试单个接口** - 使用curl或浏览器工具测试
3. **检查数据库** - 确认数据库连接和表结构
4. **联系支持** - 如果问题持续存在

---

**注意**: 修复后请测试所有管理后台功能确保正常工作。

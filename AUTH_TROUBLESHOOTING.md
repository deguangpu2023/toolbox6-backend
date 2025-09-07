# 🔐 认证问题诊断指南

## 问题：管理后台认证失败

### 🔍 问题症状
- 页面统计API正常（200状态）
- 其他管理API返回500错误
- 错误信息：`{"error":"Unauthorized","chinese":"未授权访问"}`

### 🛠️ 诊断步骤

#### 1. 检查环境变量
在Railway Dashboard中确认 `ADMIN_TOKEN` 环境变量已设置：

```bash
ADMIN_TOKEN=admin123
```

#### 2. 测试认证接口
访问认证测试接口：
```
https://your-app.railway.app/api/debug/auth-test
```

期望返回：
```json
{
  "authHeader": "未提供",
  "expectedToken": "Bearer admin123",
  "adminToken": "admin123",
  "isMatch": false,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 3. 检查Railway日志
```bash
railway logs --tail
```

查看认证相关的日志：
```
🔍 获取留言统计请求
认证头: 已提供
期望令牌: Bearer admin123
环境变量ADMIN_TOKEN: admin123
❌ 认证失败
```

### 🔧 常见问题及解决方案

#### 问题1：环境变量未设置
**症状：** `adminToken: "未设置"`

**解决方案：**
1. 在Railway Dashboard中设置环境变量
2. 重启服务
3. 重新部署

#### 问题2：令牌格式错误
**症状：** `isMatch: false`

**解决方案：**
1. 确认令牌格式为 `Bearer admin123`
2. 检查令牌前后是否有空格
3. 确认令牌大小写正确

#### 问题3：环境变量值错误
**症状：** 期望令牌与实际令牌不匹配

**解决方案：**
1. 检查Railway环境变量值
2. 确认没有多余的空格或字符
3. 重新设置环境变量

### 🚀 快速修复

#### 方法1：重新设置环境变量
```bash
# 在Railway Dashboard中设置
ADMIN_TOKEN=admin123
```

#### 方法2：重启服务
在Railway Dashboard中重启服务。

#### 方法3：重新部署
```bash
git add .
git commit -m "Fix authentication issues"
git push origin main
```

### 📋 检查清单

- [ ] 环境变量 `ADMIN_TOKEN` 已设置
- [ ] 环境变量值正确（无多余空格）
- [ ] 服务已重启
- [ ] 认证测试接口返回正确结果
- [ ] 浏览器控制台显示认证成功

### 🔍 调试工具

#### 1. 认证测试接口
```
GET /api/debug/auth-test
```
返回详细的认证信息。

#### 2. 健康检查接口
```
GET /health
```
检查服务状态。

#### 3. 数据库状态接口
```
GET /api/debug/database-status
```
检查数据库连接。

### 📞 获取帮助

如果问题仍然存在：

1. **查看Railway日志** - 获取详细的服务器日志
2. **检查环境变量** - 确认所有环境变量设置正确
3. **测试认证接口** - 使用调试接口检查认证状态
4. **重新部署** - 尝试重新部署应用

### 🔄 完整修复流程

```bash
# 1. 检查Railway状态
railway status

# 2. 查看日志
railway logs --tail

# 3. 检查环境变量
# 在Railway Dashboard中确认 ADMIN_TOKEN=admin123

# 4. 重启服务
railway restart

# 5. 重新部署
railway up
```

---

**注意**: 修复后请测试管理后台登录和数据加载功能。

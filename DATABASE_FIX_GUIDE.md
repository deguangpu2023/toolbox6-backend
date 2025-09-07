# 🗄️ 数据库修复指南

## 问题：管理后台数据加载失败

### 🔍 问题分析
- ✅ 认证成功，令牌已设置
- ✅ 页面统计API正常（200状态）
- ❌ 访问记录、留言管理、点赞管理API返回500错误
- ❌ 留言数量和点赞数量正常显示，但详细内容无法查看

### 🛠️ 解决方案

#### 方法1：使用数据库修复接口（推荐）

访问以下URL来检查和修复数据库表：
```
POST https://your-app.railway.app/api/debug/fix-database
```

这个接口会：
1. 检查数据库连接池状态
2. 自动创建缺失的表（messages, tool_likes）
3. 验证表结构
4. 返回详细的修复结果

#### 方法2：手动检查数据库状态

访问数据库状态检查接口：
```
GET https://your-app.railway.app/api/debug/database-status
```

期望返回：
```json
{
  "messagePool": true,
  "connection": "OK",
  "tables": ["messages", "tool_likes"]
}
```

#### 方法3：通过Railway CLI连接数据库

```bash
# 连接数据库
railway connect mysql

# 手动创建表
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tool_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tool_id VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_tool_ip (tool_id, ip_address),
  INDEX idx_tool_id (tool_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 🔧 故障排除步骤

#### 步骤1：检查Railway日志
```bash
railway logs --tail
```

查看是否有以下错误：
- 数据库连接失败
- 表创建失败
- 权限错误

#### 步骤2：检查环境变量
确认Railway环境变量设置正确：
```bash
DB_HOST=xxx.railway.internal
DB_USER=root
DB_PASSWORD=xxx
DB_NAME=railway
DB_PORT=3306
```

#### 步骤3：重启服务
在Railway Dashboard中重启服务。

#### 步骤4：重新部署
```bash
git add .
git commit -m "Fix database table creation issues"
git push origin main
```

### 📊 调试接口

#### 1. 健康检查
```
GET /health
```
检查所有服务状态。

#### 2. 数据库状态
```
GET /api/debug/database-status
```
检查数据库连接和表结构。

#### 3. 数据库修复
```
POST /api/debug/fix-database
```
自动检查和修复数据库表。

#### 4. 认证测试
```
GET /api/debug/auth-test
```
测试认证功能。

### 🚀 快速修复

#### 使用curl命令修复数据库：
```bash
curl -X POST https://your-app.railway.app/api/debug/fix-database
```

#### 使用浏览器开发者工具：
1. 打开浏览器开发者工具（F12）
2. 在Console中执行：
```javascript
fetch('/api/debug/fix-database', {method: 'POST'})
  .then(response => response.json())
  .then(data => console.log('修复结果:', data));
```

### 📋 检查清单

- [ ] 数据库连接池已初始化
- [ ] messages 表已创建
- [ ] tool_likes 表已创建
- [ ] 表结构正确
- [ ] 索引已创建
- [ ] 权限设置正确

### 🔄 完整修复流程

```bash
# 1. 检查Railway状态
railway status

# 2. 查看日志
railway logs --tail

# 3. 修复数据库表
curl -X POST https://your-app.railway.app/api/debug/fix-database

# 4. 检查修复结果
curl https://your-app.railway.app/api/debug/database-status

# 5. 重启服务
railway restart

# 6. 重新部署
railway up
```

### 📞 获取帮助

如果问题仍然存在：

1. **查看Railway日志** - 获取详细的错误信息
2. **检查数据库权限** - 确认MySQL用户有创建表的权限
3. **联系Railway支持** - 如果数据库连接有问题
4. **重新创建MySQL插件** - 在Railway Dashboard中重新添加MySQL

---

**注意**: 修复后请测试管理后台的所有功能确保正常工作。

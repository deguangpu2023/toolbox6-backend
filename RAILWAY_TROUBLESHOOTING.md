# 🚨 Railway 部署故障排除指南

## 问题：工具点赞API返回500错误

### 🔍 问题分析
前端访问首页时，工具点赞API (`/api/tools/:toolId/likes`) 返回500错误，可能的原因：

1. **数据库连接问题** - 留言板数据库未正确初始化
2. **表结构问题** - `tool_likes` 表未创建
3. **环境变量问题** - 数据库配置不正确
4. **连接池问题** - 数据库连接池未正确创建

### 🛠️ 解决步骤

#### 1. 检查Railway日志
```bash
# 通过Railway CLI查看日志
railway logs --tail

# 或者通过Railway Dashboard查看
# 访问: https://railway.app/dashboard
# 选择项目 -> 查看部署日志
```

#### 2. 检查健康状态
访问以下URL检查服务状态：
```
https://your-app.railway.app/health
```

期望返回：
```json
{
  "status": "OK",
  "services": {
    "visitorDatabase": "OK",
    "messageDatabase": "OK"
  }
}
```

#### 3. 检查数据库状态
访问调试接口：
```
https://your-app.railway.app/api/debug/database-status
```

期望返回：
```json
{
  "messagePool": true,
  "connection": "OK",
  "tables": ["messages", "tool_likes"]
}
```

#### 4. 检查环境变量
在Railway Dashboard中确认以下环境变量已设置：

**必需的环境变量：**
```bash
# 数据库配置（Railway自动提供）
MYSQLHOST=xxx.railway.internal
MYSQLUSER=root
MYSQLPASSWORD=xxx
MYSQLDATABASE=railway
MYSQLPORT=3306

# 服务器配置
NODE_ENV=production
PORT=3001

# 管理员配置
ADMIN_TOKEN=admin123
ADMIN_API_KEY=EpZRllhApFMUenjfLOyXSilDPHFyGbPg
```

### 🔧 修复方法

#### 方法1：重新部署
```bash
# 推送代码触发重新部署
git add .
git commit -m "Fix database initialization"
git push origin main
```

#### 方法2：手动重启服务
在Railway Dashboard中：
1. 进入项目
2. 选择服务
3. 点击"Restart"按钮

#### 方法3：检查MySQL插件
确保MySQL插件已正确添加：
1. 在Railway Dashboard中
2. 点击"New" -> "Database" -> "MySQL"
3. 确认插件状态为"Active"

#### 方法4：手动创建表
如果表未创建，可以通过Railway CLI连接数据库：
```bash
# 连接数据库
railway connect mysql

# 手动创建表
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

### 📊 日志分析

#### 正常启动日志应该包含：
```
🔧 初始化留言板数据库...
✅ 留言板数据库连接成功
📝 创建消息表...
✅ 消息表创建/检查完成
👍 创建工具点赞表...
✅ 工具点赞表创建/检查完成
📊 已创建的表: messages,tool_likes
✅ 留言板数据库初始化完成
💬 留言板功能已启用
```

#### 错误日志示例：
```
❌ 留言板数据库连接失败: ER_ACCESS_DENIED_ERROR
❌ 数据库连接池未初始化
❌ 获取点赞数失败: Table 'railway.tool_likes' doesn't exist
```

### 🚀 预防措施

#### 1. 环境变量检查
在部署前确保所有必需的环境变量都已设置。

#### 2. 数据库连接测试
在代码中添加数据库连接测试，确保启动时能正确连接。

#### 3. 错误处理
添加完善的错误处理和日志记录，便于问题定位。

#### 4. 健康检查
使用健康检查接口监控服务状态。

### 📞 获取帮助

如果问题仍然存在：

1. **查看完整日志** - 通过Railway Dashboard或CLI获取详细日志
2. **检查环境变量** - 确认所有必需的环境变量都已正确设置
3. **测试数据库连接** - 使用调试接口检查数据库状态
4. **重新部署** - 尝试重新部署应用

### 🔄 快速修复脚本

如果问题持续存在，可以尝试以下快速修复：

```bash
# 1. 检查Railway状态
railway status

# 2. 查看日志
railway logs --tail

# 3. 重启服务
railway restart

# 4. 重新部署
railway up
```

---

**注意**: 修复后请测试以下接口确保功能正常：
- `GET /health` - 健康检查
- `GET /api/debug/database-status` - 数据库状态
- `GET /api/tools/colorpicker/likes` - 工具点赞测试

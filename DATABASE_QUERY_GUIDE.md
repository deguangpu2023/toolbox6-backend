# 📊 数据库直接查询留言内容

## 🔍 方法1：通过Railway CLI查询

### 连接数据库
```bash
# 安装Railway CLI
npm install -g @railway/cli

# 登录Railway
railway login

# 选择项目
railway link

# 连接MySQL数据库
railway connect mysql
```

### 查询留言内容
```sql
-- 查看所有留言
SELECT * FROM messages ORDER BY created_at DESC;

-- 查看最近的10条留言
SELECT id, name, email, message, created_at 
FROM messages 
ORDER BY created_at DESC 
LIMIT 10;

-- 查看留言统计
SELECT COUNT(*) as total_messages FROM messages;

-- 查看今天的留言
SELECT * FROM messages 
WHERE DATE(created_at) = CURDATE() 
ORDER BY created_at DESC;

-- 查看本周的留言
SELECT * FROM messages 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
ORDER BY created_at DESC;
```

## 🔍 方法2：通过MySQL客户端

### 连接信息
```
主机: maglev.proxy.rlwy.net
端口: 48332
用户名: root
密码: [从Railway环境变量获取]
数据库: railway
```

### 使用MySQL Workbench或其他客户端
1. 创建新连接
2. 输入上述连接信息
3. 执行SQL查询

## 🔍 方法3：通过API接口

### 简单查看接口（无需认证）
```bash
# 查看留言内容
curl "https://your-app.railway.app/api/messages/view?page=1&limit=10"

# 查看留言统计
curl "https://your-app.railway.app/api/messages/stats"
```

### 管理接口（需要认证）
```bash
# 查看所有留言（需要认证）
curl -H "Authorization: Bearer admin123" \
  "https://your-app.railway.app/api/messages?page=1&limit=20"
```

## 🔍 方法4：通过网页界面

### 简单留言查看页面
访问：`https://your-app.railway.app/messages`

### 管理后台
访问：`https://your-app.railway.app/admin`
- 用户名：admin123
- 密码：admin123

## 📋 常用查询语句

### 基础查询
```sql
-- 查看表结构
DESCRIBE messages;

-- 查看所有留言
SELECT * FROM messages;

-- 查看留言数量
SELECT COUNT(*) FROM messages;
```

### 高级查询
```sql
-- 按时间范围查询
SELECT * FROM messages 
WHERE created_at BETWEEN '2025-01-01' AND '2025-12-31'
ORDER BY created_at DESC;

-- 按用户查询
SELECT * FROM messages 
WHERE name LIKE '%用户名%'
ORDER BY created_at DESC;

-- 按邮箱查询
SELECT * FROM messages 
WHERE email LIKE '%@example.com'
ORDER BY created_at DESC;

-- 统计每日留言数量
SELECT DATE(created_at) as date, COUNT(*) as count
FROM messages
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 数据导出
```sql
-- 导出所有留言到CSV格式
SELECT id, name, email, message, created_at
FROM messages
ORDER BY created_at DESC
INTO OUTFILE '/tmp/messages.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

## 🛠️ 故障排除

### 连接问题
```bash
# 检查Railway服务状态
railway status

# 查看Railway日志
railway logs --tail

# 重启Railway服务
railway up
```

### 权限问题
```sql
-- 检查用户权限
SHOW GRANTS FOR 'root'@'%';

-- 检查数据库权限
SELECT * FROM mysql.user WHERE User = 'root';
```

## 📱 移动端查看

### 使用手机浏览器
1. 访问：`https://your-app.railway.app/messages`
2. 支持响应式设计，手机友好

### 使用API客户端
- Postman
- Insomnia
- curl命令

## 🔒 安全注意事项

1. **不要在生产环境暴露数据库连接信息**
2. **定期备份数据库**
3. **限制数据库访问权限**
4. **使用HTTPS访问API**

## 📞 获取帮助

如果遇到问题：
1. 查看Railway日志
2. 检查数据库连接状态
3. 确认环境变量设置
4. 重启Railway服务

---

**推荐使用方法1（API接口）或方法4（网页界面），最简单且安全。**

# 🚀 Railway部署指南

## 📋 部署前准备

### 1. 安装Railway CLI
```bash
npm install -g @railway/cli
```

### 2. 登录Railway
```bash
railway login
```

### 3. 初始化项目
```bash
railway init
```

## 🗄️ 数据库配置

### 方法1：使用Railway MySQL插件（推荐）

#### 1. 创建MySQL数据库
- 在Railway Dashboard中点击"New Service"
- 选择"Database" → "MySQL"
- 等待数据库创建完成

#### 2. 获取数据库连接信息
- 在MySQL服务页面，点击"Connect"
- 复制连接信息到环境变量

#### 3. 配置环境变量
在Railway Dashboard中设置以下环境变量：

```env
# 数据库配置
DB_HOST=${MYSQLHOST}
DB_USER=${MYSQLUSER}
DB_PASSWORD=${MYSQLPASSWORD}
DB_NAME=${MYSQLDATABASE}
DB_PORT=${MYSQLPORT}

# 服务器配置
PORT=${PORT}
NODE_ENV=production

# 安全配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ADMIN_API_KEY=your_secret_key_here
```

### 方法2：使用外部MySQL数据库

#### 1. 配置外部数据库连接
```env
DB_HOST=your-mysql-host.com
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=toolbox_stats
DB_PORT=3306
```

#### 2. 确保数据库可访问
- 检查防火墙设置
- 确保IP白名单包含Railway的IP
- 验证数据库用户权限

## 🚀 部署步骤

### 1. 自动部署（推荐）
```bash
# 运行部署脚本
deploy-railway.bat
```

### 2. 手动部署
```bash
# 构建并部署
railway up

# 查看部署状态
railway status

# 查看日志
railway logs
```

### 3. 设置自定义域名（可选）
```bash
# 添加自定义域名
railway domain add your-domain.com
```

## 🔧 部署后配置

### 1. 初始化数据库
部署完成后，数据库表会自动创建。如果需要手动初始化：

```bash
# 连接到Railway MySQL
railway connect

# 执行初始化脚本
mysql -u root -p toolbox_stats < init-db.sql
```

### 2. 健康检查
访问健康检查端点：
```
https://your-app.railway.app/health
```

### 3. 监控和日志
- 在Railway Dashboard查看实时日志
- 监控资源使用情况
- 设置告警通知

## 📊 环境变量说明

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DB_HOST` | MySQL主机地址 | `${MYSQLHOST}` |
| `DB_USER` | MySQL用户名 | `${MYSQLUSER}` |
| `DB_PASSWORD` | MySQL密码 | `${MYSQLPASSWORD}` |
| `DB_NAME` | 数据库名称 | `${MYSQLDATABASE}` |
| `DB_PORT` | MySQL端口 | `${MYSQLPORT}` |
| `PORT` | 应用端口 | `${PORT}` |
| `NODE_ENV` | 环境模式 | `production` |

## 🚨 常见问题

### 1. 数据库连接失败
- 检查环境变量是否正确设置
- 确认MySQL服务正在运行
- 验证网络连接和防火墙设置

### 2. 部署失败
- 检查代码语法错误
- 确认所有依赖都已安装
- 查看Railway构建日志

### 3. 应用无法启动
- 检查启动命令是否正确
- 确认端口配置
- 查看应用日志

## 🔗 有用的Railway命令

```bash
# 查看服务状态
railway status

# 查看日志
railway logs

# 重启服务
railway restart

# 查看环境变量
railway variables

# 连接到数据库
railway connect

# 查看服务详情
railway service
```

## 📞 获取帮助

- Railway文档：https://docs.railway.app/
- Railway Discord：https://discord.gg/railway
- GitHub Issues：https://github.com/railwayapp/railway

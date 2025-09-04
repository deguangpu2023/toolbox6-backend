# Railway后端部署步骤指南

## 🚀 快速部署步骤

### 1. 准备工作

#### 1.1 安装必要工具
- **Node.js**: https://nodejs.org/ (推荐18.x版本)
- **Railway CLI**: `npm install -g @railway/cli`

#### 1.2 登录Railway
```bash
railway login
```

### 2. 部署后端服务

#### 2.1 运行部署脚本
在`server`文件夹中运行：
```bash
railway-deploy.bat
```

#### 2.2 手动部署（如果脚本失败）
```bash
# 初始化项目
railway init

# 安装依赖
npm install

# 部署
railway up
```

### 3. 配置数据库

#### 3.1 在Railway Dashboard中添加MySQL服务
1. 进入您的Railway项目
2. 点击 "New Service" → "Database" → "MySQL"
3. 等待数据库服务启动

#### 3.2 设置环境变量
在Railway Dashboard的Variables标签页中设置：

```env
# 数据库连接（Railway自动提供）
DB_HOST=${MYSQLHOST}
DB_USER=${MYSQLUSER}
DB_PASSWORD=${MYSQLPASSWORD}
DB_NAME=${MYSQLDATABASE}
DB_PORT=${MYSQLPORT}

# 服务器配置
PORT=${PORT}
NODE_ENV=production

# 安全配置
ADMIN_API_KEY=EpZRllhApFMUenjfLOyXSilDPHFyGbPg
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 时区设置
TZ=Asia/Shanghai
```

### 4. 验证部署

#### 4.1 检查服务状态
```bash
railway status
```

#### 4.2 查看日志
```bash
railway logs
```

#### 4.3 测试API
访问以下URL测试服务：
- 健康检查: `https://your-app.railway.app/health`
- API文档: `https://your-app.railway.app/`

### 5. 获取数据库连接信息

#### 5.1 从Railway Dashboard获取
1. 进入MySQL服务页面
2. 在"Connect"标签页查看连接信息
3. 复制连接字符串或单独的参数

#### 5.2 从环境变量获取
```bash
railway variables
```

### 6. 更新前端配置

#### 6.1 获取后端API URL
从Railway Dashboard获取您的应用URL，格式如：
`https://your-app-name.railway.app`

#### 6.2 更新前端API配置
在`src/config/api.js`中更新：
```javascript
const API_BASE_URL = 'https://your-app-name.railway.app';
```

## 🔧 故障排除

### 常见问题

#### 1. 数据库连接失败
- 检查环境变量是否正确设置
- 确认MySQL服务已启动
- 检查防火墙设置

#### 2. 部署失败
- 检查Node.js版本（需要18.x+）
- 确认所有依赖已安装
- 查看Railway日志获取详细错误信息

#### 3. API无法访问
- 检查CORS配置
- 确认端口设置正确
- 验证健康检查路径

### 日志查看
```bash
# 实时日志
railway logs --follow

# 最近100行日志
railway logs --tail 100
```

## 📊 API接口说明

部署成功后，您的API将提供以下接口：

- `GET /` - API信息
- `GET /health` - 健康检查
- `POST /api/visit` - 记录页面访问
- `GET /api/stats/page/:pageUrl` - 获取页面统计
- `GET /api/stats/overall` - 获取总体统计
- `GET /api/stats/top-pages` - 获取热门页面
- `GET /api/stats/trend` - 获取访问趋势
- `POST /api/admin/cleanup` - 清理旧数据

## 🎯 下一步

1. 测试所有API接口
2. 更新前端配置指向新的后端URL
3. 配置域名（可选）
4. 设置监控和告警（可选）

## 📞 支持

如果遇到问题，请：
1. 查看Railway日志
2. 检查环境变量配置
3. 确认数据库服务状态
4. 参考Railway官方文档

# 网站访问统计系统 - 后端服务器

这是一个基于 Node.js + Express + MySQL 的网站访问统计系统，用于记录和分析网站访问数据。

## 🚀 功能特性

- **实时访问记录**: 自动记录每个页面的访问情况
- **访问统计**: 总访问量、今日访问、本周访问、独立访客等
- **热门页面排行**: 按访问量排序的页面排行榜
- **访问趋势分析**: 最近7天的访问趋势图表
- **数据持久化**: 使用MySQL数据库存储所有统计数据
- **API接口**: 提供完整的RESTful API接口
- **安全防护**: 包含请求限制、CORS配置等安全措施

## 📋 系统要求

- Node.js >= 18.0.0
- MySQL >= 5.7 或 MariaDB >= 10.3
- npm >= 8.0.0

## 🛠️ 安装步骤

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd server
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
复制 `env.example` 文件为 `.env` 并修改配置：
```bash
cp env.example .env
```

编辑 `.env` 文件：
```env
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=toolbox_stats
DB_PORT=3306

# 服务器配置
PORT=3001
NODE_ENV=development

# 安全配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 管理API密钥（可选）
ADMIN_API_KEY=your_secret_key_here
```

### 4. 创建数据库
```bash
mysql -u root -p < init-db.sql
```

或者手动执行SQL脚本：
```sql
CREATE DATABASE toolbox_stats CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. 启动服务器
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 🗄️ 数据库结构

### 主要数据表

1. **visitor_stats**: 访问记录详情
   - 页面URL、访问者IP、用户代理、来源页面、访问时间

2. **page_summary**: 页面统计汇总
   - 页面URL、总访问量、独立访客数、最后更新时间

3. **daily_stats**: 每日访问统计
   - 日期、页面URL、当日访问量、当日独立访客数

## 🔌 API接口

### 基础URL
```
http://localhost:3001/api
```

### 接口列表

#### 1. 记录页面访问
```
POST /api/visit
Content-Type: application/json

{
  "pageUrl": "/home"
}
```

#### 2. 获取页面统计
```
GET /api/stats/page/:pageUrl

例如: GET /api/stats/page/home
```

#### 3. 获取总体统计
```
GET /api/stats/overall
```

#### 4. 获取热门页面排行
```
GET /api/stats/top-pages?limit=10
```

#### 5. 获取访问趋势
```
GET /api/stats/trend?days=7
```

#### 6. 清理旧数据（需要API密钥）
```
POST /api/admin/cleanup
Headers: x-api-key: your_secret_key
```

## 🔧 配置说明

### 数据库连接配置
- `DB_HOST`: 数据库主机地址
- `DB_USER`: 数据库用户名
- `DB_PASSWORD`: 数据库密码
- `DB_NAME`: 数据库名称
- `DB_PORT`: 数据库端口

### 服务器配置
- `PORT`: 服务器监听端口
- `NODE_ENV`: 运行环境（development/production）

### 安全配置
- `RATE_LIMIT_WINDOW_MS`: 请求限制时间窗口（毫秒）
- `RATE_LIMIT_MAX_REQUESTS`: 时间窗口内最大请求数
- `ADMIN_API_KEY`: 管理接口的API密钥

## 📊 数据统计逻辑

### 访问量统计
- 每次页面访问都会增加总访问量
- 支持重复访问统计

### 独立访客统计
- 基于IP地址识别独立访客
- 24小时内同一IP访问同一页面只计算一次

### 数据清理
- 自动清理90天前的访问记录
- 每天凌晨2点执行清理任务

## 🚀 部署到生产环境

### 1. 使用PM2管理进程
```bash
npm install -g pm2
pm2 start server.js --name "visitor-counter"
pm2 save
pm2 startup
```

### 2. 使用Nginx反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 3. 使用Docker部署
```bash
# 构建镜像
docker build -t visitor-counter .

# 运行容器
docker run -d \
  --name visitor-counter \
  -p 3001:3001 \
  --env-file .env \
  --restart unless-stopped \
  visitor-counter
```

## 🔍 监控和日志

### 健康检查
```
GET /health
```

### 日志记录
- 访问记录日志
- 错误日志
- 性能监控日志

## 🛡️ 安全特性

- **请求限制**: 防止API滥用
- **CORS配置**: 控制跨域访问
- **Helmet**: 安全头设置
- **输入验证**: 参数验证和清理
- **错误处理**: 安全的错误响应

## 📈 性能优化

- **连接池**: MySQL连接池管理
- **索引优化**: 数据库查询优化
- **缓存策略**: 减少重复查询
- **异步处理**: 非阻塞I/O操作

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务是否启动
   - 验证连接参数是否正确
   - 确认数据库用户权限

2. **API请求失败**
   - 检查服务器是否正常运行
   - 验证API地址和端口
   - 查看服务器日志

3. **统计数据不准确**
   - 检查数据清理任务是否正常
   - 验证统计逻辑是否正确
   - 查看数据库表结构

### 日志查看
```bash
# 查看PM2日志
pm2 logs visitor-counter

# 查看Docker日志
docker logs visitor-counter
```

## 📞 技术支持

如有问题，请检查：
1. 服务器日志
2. 数据库连接状态
3. 环境变量配置
4. 网络连接和防火墙设置

## 📄 许可证

MIT License

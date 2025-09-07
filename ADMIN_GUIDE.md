# Toolbox6 管理后台使用指南

## 🚀 快速开始

### 1. 启动服务器
```bash
cd server
npm start
# 或者
node server.js
```

### 2. 访问管理后台
打开浏览器访问：`http://localhost:3001/admin`

### 3. 管理员登录
- **默认令牌**: `admin123`
- **自定义令牌**: 设置环境变量 `ADMIN_TOKEN=你的令牌`

## 📊 功能说明

### 统计概览
- **总访问量**: 所有页面的访问次数总和
- **独立访客**: 去重后的访客数量
- **页面数量**: 已统计的页面总数
- **留言总数**: 用户提交的留言数量
- **点赞总数**: 所有工具获得的点赞数量

### 访问记录
- 查看详细的访问记录
- 包含访问时间、页面URL、IP地址、来源、浏览器信息
- 支持分页浏览（每页20条记录）

### 留言管理
- 查看所有用户留言
- 显示留言时间、姓名、邮箱、内容、IP地址
- 支持分页浏览（每页20条记录）

### 点赞管理
- 查看所有工具点赞记录
- 显示点赞时间、工具ID、IP地址、浏览器信息
- 支持分页浏览（每页20条记录）
- 防重复点赞机制（同一IP只能点赞一次）

### 页面统计
- 查看各页面的访问统计
- 显示页面URL、总访问量、独立访客数、最后更新时间
- 按访问量排序

## 🔧 配置说明

### 环境变量
```bash
# 管理员令牌（可选，默认为 admin123）
ADMIN_TOKEN=your_admin_token

# 数据库配置
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=toolbox6
MYSQL_PORT=3306

# 服务器配置
PORT=3001
NODE_ENV=production
```

### API接口

#### 公开接口
- `GET /` - 服务器信息
- `GET /health` - 健康检查
- `POST /api/visit` - 记录页面访问
- `GET /api/stats/page/:pageUrl` - 获取页面统计
- `GET /api/stats/overall` - 获取总体统计
- `GET /api/stats/top-pages` - 获取热门页面
- `GET /api/stats/trend` - 获取访问趋势
- `POST /api/messages` - 提交留言

#### 管理接口（需要认证）
- `GET /api/messages/stats` - 获取留言统计
- `GET /api/messages` - 获取所有留言
- `GET /api/admin/visits` - 获取访问记录
- `GET /api/tools/:toolId/likes` - 获取工具点赞数
- `POST /api/tools/:toolId/likes` - 点赞工具
- `DELETE /api/tools/:toolId/likes` - 取消点赞工具
- `GET /api/tools/likes/stats` - 获取所有工具点赞统计
- `GET /api/admin/tool-likes` - 获取工具点赞记录
- `POST /api/admin/cleanup` - 清理旧数据

## 🔐 安全说明

### 认证方式
- 使用 Bearer Token 认证
- 令牌通过 Authorization 头部传递
- 格式：`Authorization: Bearer your_token`

### 安全建议
1. **修改默认令牌**: 生产环境中务必修改默认的管理员令牌
2. **HTTPS**: 生产环境建议使用HTTPS
3. **防火墙**: 限制管理后台的访问IP
4. **定期清理**: 使用清理接口定期删除旧数据

## 🛠️ 故障排除

### 常见问题

#### 1. 无法访问管理后台
- 检查服务器是否正常启动
- 确认端口3001是否被占用
- 检查防火墙设置

#### 2. 登录失败
- 确认令牌是否正确
- 检查环境变量设置
- 查看服务器日志

#### 3. 数据不显示
- 检查数据库连接
- 确认数据库表是否创建
- 查看服务器错误日志

#### 4. 数据库连接失败
- 检查数据库服务是否运行
- 确认数据库配置信息
- 检查网络连接

### 日志查看
```bash
# 查看服务器日志
tail -f server.log

# 或者直接查看控制台输出
```

## 📱 移动端支持

管理后台已适配移动端，支持：
- 响应式布局
- 触摸操作
- 移动端友好的表格显示

## 🔄 数据备份

### 手动备份
```sql
-- 备份访问统计数据
mysqldump -u root -p toolbox6 visitor_stats page_summary daily_stats > visitor_backup.sql

-- 备份留言数据
mysqldump -u root -p toolbox6 messages > messages_backup.sql
```

### 自动清理
- 系统会自动清理90天前的访问记录
- 可通过API手动触发清理：`POST /api/admin/cleanup`

## 📞 技术支持

如有问题，请检查：
1. 服务器日志
2. 数据库连接状态
3. 网络连接
4. 环境变量配置

---

**注意**: 请妥善保管管理员令牌，不要在生产环境中使用默认令牌！

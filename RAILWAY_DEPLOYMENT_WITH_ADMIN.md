# 🚀 Railway 部署指南（包含管理后台）

## 📋 部署概述

上传到Railway后，系统会自动：
1. **自动部署** - 检测到代码变更后自动构建和部署
2. **数据库初始化** - 自动创建访问统计和留言板数据表
3. **管理后台** - 可通过 `https://your-app.railway.app/admin` 访问

## 🔧 部署步骤

### 1. 准备代码
确保以下文件已更新：
- ✅ `server.js` - 包含留言板功能
- ✅ `visitorService.js` - 包含新的API方法
- ✅ `admin/index.html` - 管理后台界面
- ✅ `railway.json` - Railway配置
- ✅ `package.json` - 依赖配置

### 2. 上传到Railway
```bash
# 方法1: 通过Git推送
git add .
git commit -m "Add admin panel and message board"
git push origin main

# 方法2: 通过Railway CLI
railway login
railway link
railway up
```

### 3. 配置环境变量
在Railway Dashboard中设置以下环境变量：

#### 🗄️ 数据库配置（自动生成）
Railway MySQL插件会自动提供这些变量，无需手动设置：
```
MYSQLHOST=xxx.railway.internal
MYSQLUSER=root
MYSQLPASSWORD=xxx
MYSQLDATABASE=railway
MYSQLPORT=3306
```

#### 🔒 安全配置（需要手动设置）
```
# 管理员API密钥
ADMIN_API_KEY=EpZRllhApFMUenjfLOyXSilDPHFyGbPg

# 管理员令牌（用于管理后台登录）
ADMIN_TOKEN=admin123

# 服务器配置
NODE_ENV=production
TZ=Asia/Shanghai

# 速率限制
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🌐 访问地址

部署完成后，您可以通过以下地址访问：

### 📊 管理后台
```
https://your-app-name.railway.app/admin
```
- **默认登录令牌**: `admin123`
- **功能**: 查看访问统计、留言管理、页面分析

### 🔌 API接口
```
https://your-app-name.railway.app/
```
- 根路径显示所有可用接口
- 健康检查: `/health`
- 访问统计: `/api/stats/*`
- 留言板: `/api/messages`

## 📱 管理后台功能

### 🎯 统计概览
- **总访问量** - 所有页面的访问次数
- **独立访客** - 去重后的访客数量
- **页面数量** - 已统计的页面总数
- **留言总数** - 用户提交的留言数量

### 📈 访问记录
- 实时访问记录查看
- 包含IP地址、浏览器、来源信息
- 支持分页浏览

### 💬 留言管理
- 查看所有用户留言
- 显示留言时间、用户信息、内容
- 支持分页浏览

### 📄 页面统计
- 各页面访问量排行
- 独立访客统计
- 最后更新时间

## 🔐 安全配置

### 生产环境安全建议
1. **修改默认令牌**:
   ```bash
   # 在Railway Dashboard中设置
   ADMIN_TOKEN=your_secure_token_here
   ```

2. **修改API密钥**:
   ```bash
   ADMIN_API_KEY=your_secure_api_key_here
   ```

3. **启用HTTPS**: Railway自动提供HTTPS

4. **限制访问**: 考虑添加IP白名单

## 🛠️ 故障排除

### 常见问题

#### 1. 管理后台无法访问
**检查项**:
- ✅ 确认部署成功
- ✅ 检查环境变量设置
- ✅ 查看Railway日志

**解决方案**:
```bash
# 查看部署日志
railway logs

# 检查服务状态
railway status
```

#### 2. 数据库连接失败
**检查项**:
- ✅ MySQL插件是否已添加
- ✅ 环境变量是否正确设置
- ✅ 数据库服务是否运行

**解决方案**:
```bash
# 重新添加MySQL插件
railway add mysql

# 检查数据库连接
railway connect mysql
```

#### 3. 留言板功能异常
**检查项**:
- ✅ 数据库表是否创建
- ✅ 环境变量配置
- ✅ 服务器日志

**解决方案**:
```bash
# 查看服务器日志
railway logs --tail

# 检查数据库表
railway connect mysql
SHOW TABLES;
```

## 📊 监控和维护

### 日志查看
```bash
# 实时日志
railway logs --tail

# 历史日志
railway logs
```

### 数据库管理
```bash
# 连接数据库
railway connect mysql

# 查看表结构
DESCRIBE messages;
DESCRIBE visitor_stats;
```

### 性能监控
- Railway Dashboard提供CPU、内存使用情况
- 访问统计API提供业务指标
- 管理后台提供实时数据

## 🔄 自动部署

Railway支持以下自动部署方式：

### Git推送部署
```bash
git push origin main
# Railway自动检测并部署
```

### 分支部署
```bash
# 推送到特定分支
git push origin staging
# 在Railway中配置分支部署
```

### 手动部署
```bash
railway up
```

## 📈 扩展功能

### 自定义域名
1. 在Railway Dashboard中添加自定义域名
2. 配置DNS记录
3. 更新CORS设置

### 数据库备份
```bash
# 导出数据
railway connect mysql
mysqldump -u root -p railway > backup.sql
```

### 环境分离
- **开发环境**: 使用开发分支
- **生产环境**: 使用主分支
- **测试环境**: 使用测试分支

## 🎉 部署完成

部署成功后，您将拥有：

✅ **自动部署** - 代码推送后自动更新  
✅ **管理后台** - 完整的Web管理界面  
✅ **访问统计** - 实时访问数据分析  
✅ **留言管理** - 用户留言查看和管理  
✅ **API服务** - 完整的RESTful API  
✅ **数据库** - 自动初始化的MySQL数据库  
✅ **HTTPS** - 自动SSL证书  
✅ **监控** - 实时性能监控  

---

**🎯 快速访问**: 部署完成后，直接访问 `https://your-app.railway.app/admin` 即可使用管理后台！

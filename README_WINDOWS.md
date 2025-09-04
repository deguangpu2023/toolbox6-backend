# Windows 启动脚本使用说明

## 🚨 重要提示：依赖未安装问题

如果您看到以下错误：
```
Error: Cannot find module 'cors'
```

**这是最常见的问题！** 说明依赖包没有安装。

### 🚀 快速解决方案
1. **首先运行** `install-deps.bat` 安装依赖
2. **然后运行** `start.bat` 启动服务器

## 🗄️ 数据库配置问题

如果您看到以下错误：
```
❌ 数据库连接失败: 无法连接到数据库，服务器启动失败
```

**这是数据库配置问题！** 需要先配置MySQL数据库。

### 🚀 数据库配置解决方案
1. **首先运行** `setup-database.bat` 配置数据库
2. **然后运行** `quick-start.bat` 启动服务器

## 问题描述
如果 `start.bat` 出现闪退问题，请按以下步骤操作：

## 解决方案

### 方法1：完整配置启动（推荐）
1. 双击运行 `setup-database.bat` 配置数据库
2. 等待配置完成后，双击运行 `quick-start.bat`

### 方法2：安装依赖后启动
1. 双击运行 `install-deps.bat` 安装依赖包
2. 等待安装完成后，双击运行 `start.bat`

### 方法3：使用调试脚本
1. 双击运行 `debug.bat`
2. 观察输出信息，查看哪一步出现问题
3. 根据错误信息进行相应修复

### 方法4：使用简化启动脚本
1. 双击运行 `start-simple.bat`
2. 这个脚本会直接启动服务器，让错误信息自然显示

### 方法5：手动启动
1. 打开命令提示符（CMD）或PowerShell
2. 切换到server目录：`cd 路径\到\server`
3. 手动执行命令：
   ```bash
   npm install
   npm start
   ```

## 数据库配置详细步骤

### 1. 安装MySQL
- 下载MySQL 8.0+：https://dev.mysql.com/downloads/mysql/
- 安装时设置root密码
- 确保MySQL服务自动启动

### 2. 创建数据库
- 运行 `setup-database.bat` 自动配置
- 或手动执行 `init-db.sql` 脚本

### 3. 配置环境变量
编辑 `.env` 文件：
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=toolbox_stats
DB_PORT=3306
```

## 常见问题排查

### 1. 依赖包未安装（最常见）
- **症状**：`Cannot find module 'cors'` 等模块错误
- **解决**：运行 `install-deps.bat` 安装依赖
- **原因**：首次运行或依赖被意外删除

### 2. 数据库连接失败（第二常见）
- **症状**：`❌ 数据库连接失败: 无法连接到数据库`
- **解决**：运行 `setup-database.bat` 配置数据库
- **原因**：MySQL未运行、配置错误或数据库不存在

### 3. Node.js未安装
- 下载并安装 Node.js 18+：https://nodejs.org/
- 安装完成后重启命令提示符

### 4. 依赖安装失败
- 检查网络连接
- 尝试使用国内镜像：`npm config set registry https://registry.npmmirror.com`
- 清除npm缓存：`npm cache clean --force`

### 5. 端口被占用
- 检查3001端口是否被其他程序占用
- 使用命令：`netstat -ano | findstr :3001`
- 如果被占用，可以在 `.env` 文件中修改 `PORT` 值

### 6. MySQL服务未启动
- 检查MySQL服务状态：`sc query mysql`
- 启动MySQL服务：`net start mysql`
- 或通过服务管理器启动MySQL服务

## 环境要求
- Windows 10/11
- Node.js 18+
- npm 8+
- MySQL 8.0+

## 联系支持
如果问题仍然存在，请：
1. 运行 `debug.bat` 并截图错误信息
2. 检查Windows事件查看器中的错误日志
3. 提供系统版本和Node.js版本信息
4. 提供MySQL版本和错误日志

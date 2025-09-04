# Railway部署指南

## 问题：Railway无法选择server文件夹作为根目录

## 解决方案

### 方案1：创建独立的backend仓库（推荐）

1. **创建新的GitHub仓库**：
   - 仓库名：`toolbox6-backend` 或 `toolbox-visitor-counter`
   - 设置为私有或公开

2. **将server文件夹内容推送到新仓库**：
   ```bash
   # 在server文件夹中
   git init
   git add .
   git commit -m "Initial backend commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/toolbox6-backend.git
   git push -u origin main
   ```

3. **在Railway中部署**：
   - 选择新创建的backend仓库
   - 根目录就是server内容
   - 设置环境变量

### 方案2：使用railway.json配置

在项目根目录创建`railway.json`：

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd server && npm start",
    "healthcheckPath": "/health"
  }
}
```

### 方案3：使用Docker部署

创建Dockerfile在根目录：

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ .
EXPOSE 3001
CMD ["npm", "start"]
```

## 推荐使用方案1：独立仓库

这是最干净和可维护的解决方案。

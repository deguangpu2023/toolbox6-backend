#!/usr/bin/env node

/**
 * 本地开发环境配置脚本
 * 用于在本地开发时使用本地MySQL数据库
 */

const fs = require('fs');
const path = require('path');

// 本地开发环境配置
const localConfig = `# 本地开发环境配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_local_password
DB_NAME=toolbox_stats
DB_PORT=3306
NODE_ENV=development
PORT=3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ADMIN_API_KEY=local_admin_key
TZ=Asia/Shanghai
`;

// 创建本地环境配置文件
const envPath = path.join(__dirname, '.env.local');

try {
  fs.writeFileSync(envPath, localConfig);
  console.log('✅ 本地开发环境配置文件已创建: .env.local');
  console.log('📝 请编辑 .env.local 文件，设置您的本地MySQL数据库密码');
  console.log('🔧 然后运行: npm run dev:local');
} catch (error) {
  console.error('❌ 创建配置文件失败:', error.message);
}

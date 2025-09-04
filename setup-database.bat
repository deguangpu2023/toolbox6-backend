@echo off
chcp 65001 >nul
title 数据库设置向导

echo ========================================
echo 🗄️  网站访问统计系统 - 数据库设置向导
echo ========================================
echo.

echo 📋 请按照以下步骤配置MySQL数据库：
echo.

echo 1. 确保MySQL服务正在运行
echo 2. 创建数据库和用户
echo 3. 配置环境变量
echo.

echo 按任意键继续...
pause >nul

echo.
echo 🔍 检查MySQL服务状态...
sc query mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到MySQL服务
    echo.
    echo 请确保MySQL已安装并正在运行
    echo 或者使用以下命令启动：
    echo   net start mysql
    echo.
    pause
    exit /b 1
) else (
    echo ✅ MySQL服务正在运行
)

echo.
echo 📝 创建环境配置文件...
if not exist .env (
    if exist env.example (
        copy env.example .env >nul 2>&1
        echo ✅ 已创建.env文件
    ) else (
        echo ❌ 未找到env.example文件
        pause
        exit /b 1
    )
) else (
    echo ✅ .env文件已存在
)

echo.
echo ⚠️  重要：请编辑.env文件，配置以下信息：
echo.
echo    DB_HOST=localhost          # MySQL服务器地址
echo    DB_USER=root              # MySQL用户名
echo    DB_PASSWORD=your_password # MySQL密码
echo    DB_NAME=toolbox_stats     # 数据库名称
echo    DB_PORT=3306              # MySQL端口
echo.
echo 📁 文件位置: %CD%\.env
echo.

echo 按任意键打开.env文件进行编辑...
pause >nul

REM 尝试用记事本打开.env文件
notepad .env

echo.
echo 🔍 检查数据库连接...
echo 请确保：
echo 1. MySQL服务正在运行
echo 2. 数据库 'toolbox_stats' 已创建
echo 3. 用户名和密码正确
echo 4. 端口3306未被占用
echo.

echo 按任意键测试数据库连接...
pause >nul

echo.
echo 🚀 测试数据库连接...
node -e "
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });
    
    console.log('✅ MySQL连接成功');
    
    // 检查数据库是否存在
    const [databases] = await connection.execute('SHOW DATABASES LIKE ?', ['toolbox_stats']);
    if (databases.length > 0) {
      console.log('✅ 数据库 toolbox_stats 已存在');
    } else {
      console.log('📝 创建数据库 toolbox_stats...');
      await connection.execute('CREATE DATABASE IF NOT EXISTS toolbox_stats CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      console.log('✅ 数据库创建成功');
    }
    
    await connection.end();
    console.log('🎉 数据库配置完成！');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.log('请检查.env文件中的配置信息');
  }
}

testDB();
"

echo.
echo 如果看到 '🎉 数据库配置完成！' 说明配置成功
echo 现在可以运行 quick-start.bat 启动服务器了
echo.

pause

#!/bin/bash

# 网站访问统计系统启动脚本
# 适用于Linux/macOS系统

echo "🚀 启动网站访问统计系统..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js 18+"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

# 检查MySQL是否运行
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL客户端未安装，跳过连接测试"
else
    echo "🔍 检查MySQL连接..."
    if ! mysql -u root -p -e "SELECT 1;" &> /dev/null; then
        echo "⚠️  MySQL连接失败，请确保MySQL服务正在运行"
        echo "   可以使用以下命令启动MySQL:"
        echo "   - Ubuntu/Debian: sudo systemctl start mysql"
        echo "   - macOS: brew services start mysql"
        echo "   - Windows: net start mysql"
    else
        echo "✅ MySQL连接正常"
    fi
fi

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "📝 创建环境变量配置文件..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ 已复制env.example为.env"
        echo "⚠️  请编辑.env文件，配置数据库连接信息"
    else
        echo "❌ 未找到env.example文件"
        exit 1
    fi
fi

# 安装依赖
echo "📦 安装依赖包..."
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已安装"
fi

# 启动服务器
echo "🌐 启动访问统计服务器..."
echo "📍 服务地址: http://localhost:3001"
echo "📊 健康检查: http://localhost:3001/health"
echo "⏹️  按Ctrl+C停止服务器"
echo ""

npm start

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection, initDatabase } = require('./database');
const visitorService = require('./visitorService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: false, // 允许内联脚本
  crossOriginEmbedderPolicy: false
}));

// CORS配置
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'https://toolbox6.com',
    'https://www.toolbox6.com'
  ],
  credentials: true
}));

// 请求限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试',
    retryAfter: '15分钟'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 获取真实IP地址
app.use((req, res, next) => {
  req.realIP = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress || 
               req.connection.socket?.remoteAddress || 
               '127.0.0.1';
  next();
});

// 根路径处理
app.get('/', (req, res) => {
  res.json({
    message: 'Toolbox6 Visitor Counter API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /health - 健康检查',
      'POST /api/visit - 记录页面访问',
      'GET /api/stats/page/:pageUrl - 获取页面统计',
      'GET /api/stats/overall - 获取总体统计',
      'GET /api/stats/top-pages - 获取热门页面',
      'GET /api/stats/trend - 获取访问趋势',
      'POST /api/admin/cleanup - 清理旧数据（需要API密钥）'
    ]
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API路由

// 记录页面访问
app.post('/api/visit', async (req, res) => {
  try {
    const { pageUrl } = req.body;
    const visitorIp = req.realIP;
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers.referer || '';
    
    if (!pageUrl) {
      return res.status(400).json({
        error: '缺少必要参数',
        message: 'pageUrl 是必需的'
      });
    }
    
    const result = await visitorService.recordVisit(pageUrl, visitorIp, userAgent, referer);
    
    res.json({
      success: true,
      data: result,
      message: '访问记录成功'
    });
    
  } catch (error) {
    console.error('记录访问失败:', error);
    res.status(500).json({
      error: '服务器内部错误',
      message: '记录访问失败，请稍后重试'
    });
  }
});

// 获取页面统计
app.get('/api/stats/page/:pageUrl', async (req, res) => {
  try {
    const { pageUrl } = req.params;
    const stats = await visitorService.getPageStats(pageUrl);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('获取页面统计失败:', error);
    res.status(500).json({
      error: '服务器内部错误',
      message: '获取统计信息失败'
    });
  }
});

// 获取总体统计
app.get('/api/stats/overall', async (req, res) => {
  try {
    const stats = await visitorService.getOverallStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('获取总体统计失败:', error);
    res.status(500).json({
      error: '服务器内部错误',
      message: '获取统计信息失败'
    });
  }
});

// 获取热门页面排行
app.get('/api/stats/top-pages', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topPages = await visitorService.getTopPages(limit);
    
    res.json({
      success: true,
      data: topPages
    });
    
  } catch (error) {
    console.error('获取热门页面失败:', error);
    res.status(500).json({
      error: '服务器内部错误',
      message: '获取热门页面失败'
    });
  }
});

// 获取访问趋势
app.get('/api/stats/trend', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const trend = await visitorService.getVisitTrend(days);
    
    res.json({
      success: true,
      data: trend
    });
    
  } catch (error) {
    console.error('获取访问趋势失败:', error);
    res.status(500).json({
      error: '服务器内部错误',
      message: '获取访问趋势失败'
    });
  }
});

// 管理接口 - 清理旧数据
app.post('/api/admin/cleanup', async (req, res) => {
  try {
    // 简单的API密钥验证
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({
        error: '未授权',
        message: '需要有效的API密钥'
      });
    }
    
    const cleanedCount = await visitorService.cleanupOldData();
    
    res.json({
      success: true,
      message: `清理完成，删除了 ${cleanedCount} 条旧记录`,
      cleanedCount
    });
    
  } catch (error) {
    console.error('清理旧数据失败:', error);
    res.status(500).json({
      error: '服务器内部错误',
      message: '清理失败'
    });
  }
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    message: '请求的API接口不存在',
    availableEndpoints: [
      'POST /api/visit - 记录页面访问',
      'GET /api/stats/page/:pageUrl - 获取页面统计',
      'GET /api/stats/overall - 获取总体统计',
      'GET /api/stats/top-pages - 获取热门页面',
      'GET /api/stats/trend - 获取访问趋势',
      'POST /api/admin/cleanup - 清理旧数据（需要API密钥）'
    ]
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    error: '服务器内部错误',
    message: '服务器发生未知错误，请稍后重试'
  });
});

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 无法连接到数据库，服务器启动失败');
      process.exit(1);
    }
    
    // 初始化数据库
    await initDatabase();
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log(`🚀 访问统计服务器启动成功`);
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`📊 健康检查: http://localhost:${PORT}/health`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
    });
    
    // 设置定时任务 - 每天凌晨2点清理旧数据
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        console.log('🧹 执行定时清理任务...');
        visitorService.cleanupOldData().catch(console.error);
      }
    }, 60 * 1000); // 每分钟检查一次
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🔄 收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

// 启动服务器
startServer();

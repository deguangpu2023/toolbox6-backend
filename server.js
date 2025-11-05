const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise');
const path = require('path');
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
    'https://www.toolbox6.com',
    'https://toolbox6-backend-production.up.railway.app',
    'https://vue3-production.up.railway.app',
    'https://rgbtoo.xyz',
    'https://www.rgbtoo.xyz'
  ],
  credentials: true
}));

// 请求限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 限制每个IP 15分钟内最多1000个请求
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

// 静态文件服务
app.use('/admin', express.static('admin'));


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
      'POST /api/admin/cleanup - 清理旧数据（需要API密钥）',
      'GET /api/admin/visits - 获取访问记录（需要认证）',
      'GET /api/debug/database-status - 数据库状态检查',
      'GET /api/debug/auth-test - 认证测试',
      'GET /api/debug/timezone - 时区调试信息',
      'GET /api/debug/daily-stats - 每日统计调试信息',
      'POST /api/debug/fix-database - 数据库修复',
      'POST /api/debug/fix-daily-stats - 修复每日统计',
      'POST /api/debug/check-consistency - 数据一致性检查',
      'POST /api/debug/reinit-today-stats - 重新初始化今日统计',
      'GET /admin - 管理后台界面',
    ]
  });
});

// 健康检查
app.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {}
    };

    // 检查访问统计数据库
    try {
      const { testConnection } = require('./database');
      const dbConnected = await testConnection();
      health.services.visitorDatabase = dbConnected ? 'OK' : 'ERROR';
    } catch (error) {
      health.services.visitorDatabase = 'ERROR';
    }


    // 如果任何服务有问题，返回503状态
    const hasErrors = Object.values(health.services).some(status => status === 'ERROR');
    const statusCode = hasErrors ? 503 : 200;

    res.status(statusCode).json(health);
  } catch (error) {
    console.error('健康检查失败:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
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

// 获取详细访问记录（仅用于管理）
app.get('/api/admin/visits', async (req, res) => {
  try {
    console.log('🔍 获取访问记录请求');
    console.log('请求头:', req.headers);
    console.log('查询参数:', req.query);
    
    // 简单的认证检查
    const authHeader = req.headers.authorization;
    const expectedToken = `Bearer ${process.env.ADMIN_TOKEN || 'admin123'}`;
    
    console.log('认证头:', authHeader ? '已提供' : '未提供');
    console.log('期望令牌:', expectedToken);
    
    if (!authHeader || authHeader !== expectedToken) {
      console.log('❌ 认证失败');
      return res.status(401).json({
        error: 'Unauthorized',
        chinese: '未授权访问'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    console.log(`📊 获取访问记录: page=${page}, limit=${limit}, offset=${offset}`);

    // 获取访问记录
    console.log('🔍 调用visitorService.getVisitRecords...');
    const visits = await visitorService.getVisitRecords(limit, offset);
    console.log(`✅ 获取到 ${visits.length} 条访问记录`);
    
    // 获取总数
    console.log('🔍 调用visitorService.getTotalVisitCount...');
    const total = await visitorService.getTotalVisitCount();
    console.log(`📈 总访问记录数: ${total}`);

    res.json({
      success: true,
      data: {
        visits,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ 获取访问记录失败:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      stack: error.stack
    });
    
    res.status(500).json({
      error: '服务器内部错误',
      message: '获取访问记录失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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



// 数据库状态检查接口
app.get('/api/debug/database-status', async (req, res) => {
  try {
    const status = {
      environment: process.env.NODE_ENV || 'development'
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// 认证测试接口
app.get('/api/debug/auth-test', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const expectedToken = `Bearer ${process.env.ADMIN_TOKEN || 'admin123'}`;
    
    const result = {
      authHeader: authHeader || '未提供',
      expectedToken: expectedToken,
      adminToken: process.env.ADMIN_TOKEN || '未设置',
      isMatch: authHeader === expectedToken,
      timestamp: new Date().toISOString()
    };
    
    console.log('🔐 认证测试:', result);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// 每日统计调试接口
app.get('/api/debug/daily-stats', async (req, res) => {
  try {
    console.log('🔍 每日统计调试信息');
    
    const { testConnection } = require('./database');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      return res.status(500).json({
        error: 'Database not connected',
        chinese: '数据库未连接'
      });
    }

    const { pool } = require('./database');
    const connection = await pool.getConnection();
    
    // 获取今日统计
    const [todayStats] = await connection.execute(`
      SELECT 
        date,
        page_url,
        visits,
        unique_visitors
      FROM daily_stats 
      WHERE date = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00'))
      ORDER BY visits DESC
    `);
    
    // 获取最近7天的统计
    const [weekStats] = await connection.execute(`
      SELECT 
        date,
        SUM(visits) as total_visits,
        SUM(unique_visitors) as total_unique_visitors
      FROM daily_stats 
      WHERE date BETWEEN DATE_SUB(DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00')), INTERVAL 6 DAY) 
                   AND DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00'))
      GROUP BY date
      ORDER BY date DESC
    `);
    
    // 获取数据库当前时间（避免别名与保留关键字冲突）
    const [dbTime] = await connection.execute('SELECT NOW() as db_now, DATE(CONVERT_TZ(UTC_TIMESTAMP(), \'+00:00\', \'+08:00\')) as db_date, UTC_TIMESTAMP() as db_utc');
    
    connection.release();
    
    res.json({
      success: true,
      data: {
        databaseTime: dbTime[0],
        todayStats: todayStats,
        weekStats: weekStats,
        totalTodayRecords: todayStats.length,
        totalWeekRecords: weekStats.length
      }
    });
    
  } catch (error) {
    console.error('❌ 每日统计调试失败:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 时区调试接口
app.get('/api/debug/timezone', async (req, res) => {
  try {
    console.log('🕐 时区调试信息');
    
    const timezoneInfo = {
      nodeTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      nodeTime: new Date().toISOString(),
      nodeLocalTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      nodeToday: new Date().toISOString().split('T')[0],
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };


    // 获取访问统计数据库时区信息
    try {
      const { pool } = require('./database');
      const connection = await pool.getConnection();
      
      const [visitorDbTimezone] = await connection.execute('SELECT @@time_zone as timezone, @@system_time_zone as system_timezone');
      const [visitorDbTime] = await connection.execute('SELECT NOW() as db_time, DATE(CONVERT_TZ(UTC_TIMESTAMP(), \'+00:00\', \'+08:00\')) as db_date, UTC_TIMESTAMP() as `utc_time`');
      
      timezoneInfo.visitorDatabase = {
        timezone: visitorDbTimezone[0].timezone,
        systemTimezone: visitorDbTimezone[0].system_timezone,
        dbTime: visitorDbTime[0].db_time,
        dbDate: visitorDbTime[0].db_date,
        utcTime: visitorDbTime[0]['utc_time']
      };
      
      connection.release();
    } catch (error) {
      timezoneInfo.visitorDatabase = { error: error.message };
    }
    
    console.log('🕐 时区信息:', timezoneInfo);
    res.json(timezoneInfo);
    
  } catch (error) {
    console.error('❌ 时区调试失败:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 修复每日统计接口
app.post('/api/debug/fix-daily-stats', async (req, res) => {
  try {
    console.log('🔧 开始修复每日统计...');
    
    const { testConnection } = require('./database');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      return res.status(500).json({
        error: 'Database not connected',
        chinese: '数据库未连接'
      });
    }

    const { pool } = require('./database');
    const connection = await pool.getConnection();
    
    // 获取所有页面
    const [pages] = await connection.execute('SELECT DISTINCT page_url FROM page_summary');
    
    let fixedCount = 0;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 格式
    
    for (const page of pages) {
      const pageUrl = page.page_url;
      
      // 计算今日访问量
      const [visitsResult] = await connection.execute(`
        SELECT COUNT(*) as visits
        FROM visitor_stats 
        WHERE page_url = ? 
        AND DATE(CONVERT_TZ(visit_time, '+00:00', '+08:00')) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00'))
      `, [pageUrl]);
      
      // 计算今日唯一访客数
      const [uniqueResult] = await connection.execute(`
        SELECT COUNT(DISTINCT visitor_ip) as unique_visitors
        FROM visitor_stats 
        WHERE page_url = ? 
        AND DATE(CONVERT_TZ(visit_time, '+00:00', '+08:00')) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00'))
      `, [pageUrl]);
      
      const visits = visitsResult[0].visits;
      const uniqueVisitors = uniqueResult[0].unique_visitors;
      
      // 更新或插入每日统计
      await connection.execute(`
        INSERT INTO daily_stats (date, page_url, visits, unique_visitors)
        VALUES (DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00')), ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          visits = VALUES(visits),
          unique_visitors = VALUES(unique_visitors)
      `, [pageUrl, visits, uniqueVisitors]);
      
      if (visits > 0) {
        fixedCount++;
        console.log(`✅ 修复页面 ${pageUrl}: ${visits} 次访问, ${uniqueVisitors} 个唯一访客`);
      }
    }
    
    connection.release();
    
    console.log(`✅ 每日统计修复完成，修复了 ${fixedCount} 个页面`);
    res.json({
      success: true,
      message: `每日统计修复完成，修复了 ${fixedCount} 个页面`,
      fixedCount: fixedCount,
      totalPages: pages.length
    });
    
  } catch (error) {
    console.error('❌ 修复每日统计失败:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 数据一致性检查和修复接口
app.post('/api/debug/check-consistency', async (req, res) => {
  try {
    console.log('🔍 开始数据一致性检查...');
    
    const results = await visitorService.checkAndFixDataConsistency();
    
    console.log('✅ 数据一致性检查完成:', results);
    res.json({
      success: true,
      message: '数据一致性检查完成',
      results
    });
    
  } catch (error) {
    console.error('❌ 数据一致性检查失败:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 重新初始化今日统计数据接口
app.post('/api/debug/reinit-today-stats', async (req, res) => {
  try {
    console.log('🔧 开始重新初始化今日统计数据...');
    
    const { testConnection } = require('./database');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      return res.status(500).json({
        error: 'Database not connected',
        chinese: '数据库未连接'
      });
    }

    const { pool } = require('./database');
    const connection = await pool.getConnection();
    
    // 获取所有页面
    const [pages] = await connection.execute('SELECT DISTINCT page_url FROM page_summary');
    
    let processedCount = 0;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 格式
    
    for (const page of pages) {
      const pageUrl = page.page_url;
      
      // 计算今日访问量（直接从visitor_stats表计算）
      const [visitsResult] = await connection.execute(`
        SELECT COUNT(*) as visits
        FROM visitor_stats 
        WHERE page_url = ? 
        AND DATE(CONVERT_TZ(visit_time, '+00:00', '+08:00')) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00'))
      `, [pageUrl]);
      
      // 计算今日唯一访客数
      const [uniqueResult] = await connection.execute(`
        SELECT COUNT(DISTINCT visitor_ip) as unique_visitors
        FROM visitor_stats 
        WHERE page_url = ? 
        AND DATE(CONVERT_TZ(visit_time, '+00:00', '+08:00')) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00'))
      `, [pageUrl]);
      
      const visits = visitsResult[0].visits;
      const uniqueVisitors = uniqueResult[0].unique_visitors;
      
      // 更新或插入每日统计
      await connection.execute(`
        INSERT INTO daily_stats (date, page_url, visits, unique_visitors)
        VALUES (DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00')), ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          visits = VALUES(visits),
          unique_visitors = VALUES(unique_visitors)
      `, [pageUrl, visits, uniqueVisitors]);
      
      processedCount++;
      console.log(`✅ 处理页面 ${pageUrl}: ${visits} 次访问, ${uniqueVisitors} 个唯一访客`);
    }
    
    connection.release();
    
    console.log(`✅ 今日统计数据重新初始化完成，处理了 ${processedCount} 个页面`);
    res.json({
      success: true,
      message: `今日统计数据重新初始化完成，处理了 ${processedCount} 个页面`,
      processedCount: processedCount,
      totalPages: pages.length
    });
    
  } catch (error) {
    console.error('❌ 重新初始化今日统计失败:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 数据库表检查和修复接口
app.post('/api/debug/fix-database', async (req, res) => {
  try {
    console.log('🔧 开始检查和修复数据库表...');
    
    const results = {
      tables: {},
      errors: [],
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ 数据库表检查和修复完成');
    res.json(results);
    
  } catch (error) {
    console.error('❌ 数据库修复失败:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
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
      'POST /api/admin/cleanup - 清理旧数据（需要API密钥）',
      'GET /api/admin/visits - 获取访问记录（需要认证）',
      'GET /admin - 管理后台界面'
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
    console.log('🚀 开始启动服务器...');
    
    // 测试数据库连接
    console.log('🔍 测试访问统计数据库连接...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 无法连接到访问统计数据库，服务器启动失败');
      process.exit(1);
    }
    console.log('✅ 访问统计数据库连接成功');
    
    // 初始化访问统计数据库
    console.log('🔧 初始化访问统计数据库...');
    await initDatabase();
    console.log('✅ 访问统计数据库初始化完成');
    
    
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
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('🛑 收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

// 启动服务器
startServer();

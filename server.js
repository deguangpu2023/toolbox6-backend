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

// MySQL数据库连接配置（留言板）
const dbConfig = {
  //host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
  //user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
  //password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  //database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'toolbox6',
  //port: process.env.MYSQL_PORT || process.env.DB_PORT || 3306,
  //charset: 'utf8mb4',
  //timezone: '+00:00',
  host: process.env.DB_HOST || 'maglev.proxy.rlwy.net',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'EpZRllhApFMUenjfLOyXSilDPHFyGbPg',
  database: process.env.DB_NAME || 'railway',
  port: process.env.DB_PORT || 48332,
  adminToken: process.env.ADMIN_TOKEN || 'admin123',
  environment:process.env.NODE_ENV || 'production',
  charset: 'utf8mb4',
  timezone: '+08:00',
  connectionLimit: 10,
  //acquireTimeout: 60000,
  //timeout: 60000,
  //reconnect: true
};

// 创建数据库连接池（留言板）
let messagePool;

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
    'https://vue3-production.up.railway.app'
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

// 初始化工具点赞数据库
async function initToolLikesDatabase() {
  try {
    console.log('🔧 初始化工具点赞数据库...');
    console.log('数据库配置:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });

    messagePool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // 测试连接
    const connection = await messagePool.getConnection();
    console.log('✅ 工具点赞数据库连接成功');
    
    // 创建工具点赞表（如果不存在）
    console.log('👍 创建工具点赞表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tool_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tool_id VARCHAR(100) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_tool_ip (tool_id, ip_address),
        INDEX idx_tool_id (tool_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 工具点赞表创建/检查完成');
    
    // 验证表是否创建成功
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('tool_likes')
    `, [dbConfig.database]);
    
    console.log('📊 已创建的表:', tables.map(t => t.TABLE_NAME));
    
    connection.release();
    console.log('✅ 工具点赞数据库初始化完成');
  } catch (error) {
    console.error('❌ 工具点赞数据库连接失败:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
    
    // 在生产环境中，如果数据库连接失败，应该退出进程
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 生产环境数据库连接失败，退出进程');
      process.exit(1);
    } else {
      console.warn('⚠️ 开发环境数据库连接失败，继续运行');
    }
  }
}

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
      'GET /api/tools/:toolId/likes - 获取工具点赞数',
      'POST /api/tools/:toolId/likes - 点赞工具',
      'DELETE /api/tools/:toolId/likes - 取消点赞工具',
      'GET /api/tools/likes/stats - 获取所有工具点赞统计',
      'POST /api/tools/batch-likes - 批量获取工具点赞数',
      'GET /api/admin/tool-likes - 获取工具点赞记录（需要认证）',
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

    // 检查工具点赞数据库
    try {
      if (messagePool) {
        const connection = await messagePool.getConnection();
        await connection.execute('SELECT 1');
        connection.release();
        health.services.toolLikesDatabase = 'OK';
      } else {
        health.services.toolLikesDatabase = 'NOT_INITIALIZED';
      }
    } catch (error) {
      health.services.toolLikesDatabase = 'ERROR';
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


// 工具点赞API路由

// 获取工具点赞数
app.get('/api/tools/:toolId/likes', async (req, res) => {
  try {
    const { toolId } = req.params;
    
    console.log(`🔍 获取工具点赞数请求: toolId=${toolId}`);
    
    if (!toolId) {
      console.log('❌ 工具ID为空');
      return res.status(400).json({
        error: 'Tool ID is required',
        chinese: '工具ID是必需的'
      });
    }

    // 检查数据库连接池是否存在
    if (!messagePool) {
      console.error('❌ 数据库连接池未初始化');
      return res.status(500).json({
        error: 'Database not initialized',
        chinese: '数据库未初始化'
      });
    }

    // 查询点赞数
    const [rows] = await messagePool.execute(
      'SELECT COUNT(*) as count FROM tool_likes WHERE tool_id = ?',
      [toolId]
    );

    const count = rows[0] ? rows[0].count : 0;
    console.log(`✅ 工具 ${toolId} 点赞数: ${count}`);

    res.json({
      toolId,
      count: count
    });

  } catch (error) {
    console.error('❌ 获取点赞数失败:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
    
    res.status(500).json({
      error: 'Internal server error',
      chinese: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 点赞工具
app.post('/api/tools/:toolId/likes', async (req, res) => {
  try {
    const { toolId } = req.params;
    const clientIP = req.realIP;
    const userAgent = req.get('User-Agent');
    
    if (!toolId) {
      return res.status(400).json({
        error: 'Tool ID is required',
        chinese: '工具ID是必需的'
      });
    }

    // 检查是否已经点赞
    const [existing] = await messagePool.execute(
      'SELECT id FROM tool_likes WHERE tool_id = ? AND ip_address = ?',
      [toolId, clientIP]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Already liked',
        chinese: '已经点赞过了'
      });
    }

    // 插入点赞记录
    const [result] = await messagePool.execute(
      'INSERT INTO tool_likes (tool_id, ip_address, user_agent) VALUES (?, ?, ?)',
      [toolId, clientIP, userAgent]
    );

    // 获取新的点赞数
    const [countRows] = await messagePool.execute(
      'SELECT COUNT(*) as count FROM tool_likes WHERE tool_id = ?',
      [toolId]
    );

    console.log(`✅ 工具 ${toolId} 获得新点赞: IP=${clientIP}`);

    res.status(201).json({
      success: true,
      toolId,
      count: countRows[0].count,
      message: 'Like added successfully',
      chinese: '点赞成功'
    });

  } catch (error) {
    console.error('❌ 点赞失败:', error);
    
    // 如果是重复键错误，返回已点赞状态
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'Already liked',
        chinese: '已经点赞过了'
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      chinese: '服务器内部错误'
    });
  }
});

// 取消点赞工具
app.delete('/api/tools/:toolId/likes', async (req, res) => {
  try {
    const { toolId } = req.params;
    const clientIP = req.realIP;
    
    if (!toolId) {
      return res.status(400).json({
        error: 'Tool ID is required',
        chinese: '工具ID是必需的'
      });
    }

    // 删除点赞记录
    const [result] = await messagePool.execute(
      'DELETE FROM tool_likes WHERE tool_id = ? AND ip_address = ?',
      [toolId, clientIP]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Like not found',
        chinese: '未找到点赞记录'
      });
    }

    // 获取新的点赞数
    const [countRows] = await messagePool.execute(
      'SELECT COUNT(*) as count FROM tool_likes WHERE tool_id = ?',
      [toolId]
    );

    console.log(`✅ 工具 ${toolId} 取消点赞: IP=${clientIP}`);

    res.json({
      success: true,
      toolId,
      count: countRows[0].count,
      message: 'Like removed successfully',
      chinese: '取消点赞成功'
    });

  } catch (error) {
    console.error('❌ 取消点赞失败:', error);
    res.status(500).json({
      error: 'Internal server error',
      chinese: '服务器内部错误'
    });
  }
});

// 获取所有工具点赞统计
app.get('/api/tools/likes/stats', async (req, res) => {
  try {
    // 检查数据库连接池是否存在
    if (!messagePool) {
      console.error('❌ 数据库连接池未初始化');
      return res.status(500).json({
        error: 'Database not initialized',
        chinese: '数据库未初始化'
      });
    }

    const [rows] = await messagePool.execute(`
      SELECT 
        tool_id,
        COUNT(*) as count
      FROM tool_likes 
      GROUP BY tool_id 
      ORDER BY count DESC
    `);

    const stats = {};
    rows.forEach(row => {
      stats[row.tool_id] = row.count;
    });

    res.json({
      success: true,
      stats,
      total: rows.length
    });

  } catch (error) {
    console.error('❌ 获取统计信息失败:', error);
    res.status(500).json({
      error: 'Internal server error',
      chinese: '服务器内部错误'
    });
  }
});

// 批量获取工具点赞数接口
app.post('/api/tools/batch-likes', async (req, res) => {
  try {
    const { toolIds } = req.body;
    
    // 验证请求参数
    if (!Array.isArray(toolIds) || toolIds.length === 0) {
      return res.status(400).json({
        error: 'toolIds must be a non-empty array',
        chinese: 'toolIds 必须是非空数组'
      });
    }
    
    // 限制批量请求的数量，避免过大的请求
    if (toolIds.length > 100) {
      return res.status(400).json({
        error: 'Too many toolIds requested. Maximum 100 allowed.',
        chinese: '请求的工具ID过多，最多允许100个'
      });
    }
    
    // 检查数据库连接池是否存在
    if (!messagePool) {
      console.error('❌ 数据库连接池未初始化');
      return res.status(500).json({
        error: 'Database not initialized',
        chinese: '数据库未初始化'
      });
    }

    console.log(`🔍 批量获取工具点赞数: ${toolIds.length} 个工具`);
    
    const result = {};
    
    // 批量获取点赞数
    for (const toolId of toolIds) {
      try {
        const [rows] = await messagePool.execute(
          'SELECT COUNT(*) as count FROM tool_likes WHERE tool_id = ?',
          [toolId]
        );
        
        const count = rows[0] ? rows[0].count : 0;
        result[toolId] = count;
        
        console.log(`✅ 工具 ${toolId} 点赞数: ${count}`);
      } catch (error) {
        console.error(`❌ 获取工具 ${toolId} 点赞数失败:`, error);
        result[toolId] = 0; // 出错时返回0
      }
    }
    
    console.log(`✅ 批量获取完成，处理了 ${Object.keys(result).length} 个工具`);
    
    res.json({
      success: true,
      likes: result,
      count: Object.keys(result).length,
      requestedCount: toolIds.length,
      timestamp: new Date().toISOString(),
      message: 'Batch likes retrieved successfully',
      chinese: '批量获取点赞数成功'
    });

  } catch (error) {
    console.error('❌ 批量获取工具点赞数失败:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
    
    res.status(500).json({
      error: 'Internal server error',
      chinese: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 数据库状态检查接口
app.get('/api/debug/database-status', async (req, res) => {
  try {
    const status = {
      messagePool: !!messagePool,
      dbConfig: {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database,
        port: dbConfig.port
      },
      environment: process.env.NODE_ENV || 'development'
    };

    if (messagePool) {
      try {
        const connection = await messagePool.getConnection();
        
        // 检查表是否存在
        const [tables] = await connection.execute(`
          SELECT TABLE_NAME 
          FROM information_schema.TABLES 
          WHERE TABLE_SCHEMA = ? 
          AND TABLE_NAME IN ('tool_likes')
        `, [dbConfig.database]);
        
        status.tables = tables.map(t => t.TABLE_NAME);
        status.connection = 'OK';
        
        connection.release();
      } catch (error) {
        status.connection = 'ERROR';
        status.error = error.message;
      }
    }

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

    // 获取数据库时区信息
    if (messagePool) {
      try {
        const connection = await messagePool.getConnection();
        
        // 获取数据库时区
        const [dbTimezone] = await connection.execute('SELECT @@time_zone as timezone, @@system_time_zone as system_timezone');
        const [dbTime] = await connection.execute('SELECT NOW() as db_time, DATE(CONVERT_TZ(UTC_TIMESTAMP(), \'+00:00\', \'+08:00\')) as db_date, UTC_TIMESTAMP() as `utc_time`');
        
        timezoneInfo.database = {
          timezone: dbTimezone[0].timezone,
          systemTimezone: dbTimezone[0].system_timezone,
          dbTime: dbTime[0].db_time,
          dbDate: dbTime[0].db_date,
          utcTime: dbTime[0]['utc_time']
        };
        
        connection.release();
      } catch (error) {
        timezoneInfo.database = { error: error.message };
      }
    }

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
      messagePool: !!messagePool,
      tables: {},
      errors: [],
      timestamp: new Date().toISOString()
    };

    if (!messagePool) {
      results.errors.push('数据库连接池未初始化');
      return res.status(500).json(results);
    }

    try {
      const connection = await messagePool.getConnection();
      
      // 检查并创建 tool_likes 表
      try {
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS tool_likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tool_id VARCHAR(100) NOT NULL,
            ip_address VARCHAR(45) NOT NULL,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_tool_ip (tool_id, ip_address),
            INDEX idx_tool_id (tool_id),
            INDEX idx_created_at (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        results.tables.tool_likes = 'OK';
        console.log('✅ tool_likes 表检查/创建完成');
      } catch (error) {
        results.tables.tool_likes = 'ERROR';
        results.errors.push(`tool_likes 表错误: ${error.message}`);
        console.error('❌ tool_likes 表错误:', error);
      }

      // 检查表是否存在
      const [tables] = await connection.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME IN ('tool_likes')
      `, [dbConfig.database]);
      
      results.existingTables = tables.map(t => t.TABLE_NAME);
      
      connection.release();
      
      console.log('✅ 数据库表检查和修复完成');
      res.json(results);
      
    } catch (error) {
      results.errors.push(`数据库连接错误: ${error.message}`);
      console.error('❌ 数据库连接错误:', error);
      res.status(500).json(results);
    }
    
  } catch (error) {
    console.error('❌ 数据库修复失败:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取工具点赞记录（仅用于管理）
app.get('/api/admin/tool-likes', async (req, res) => {
  try {
    console.log('🔍 获取点赞记录请求');
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

    // 检查数据库连接池是否存在
    if (!messagePool) {
      console.error('❌ 数据库连接池未初始化');
      return res.status(500).json({
        error: 'Database not initialized',
        chinese: '数据库未初始化'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log(`📊 获取点赞记录: page=${page}, limit=${limit}, offset=${offset}`);

    // 直接使用连接池执行查询（与其他API保持一致）
    try {
      // 获取点赞记录
      console.log('🔍 执行点赞查询...');
      const [likes] = await messagePool.execute(
        'SELECT id, tool_id, ip_address, user_agent, created_at FROM tool_likes ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      console.log(`📊 查询到 ${likes.length} 条点赞记录`);

      // 获取总数
      console.log('🔍 执行计数查询...');
      const [countResult] = await messagePool.execute('SELECT COUNT(*) as total FROM tool_likes');
      const total = countResult[0] ? countResult[0].total : 0;
      console.log(`📈 总点赞数: ${total}`);

      console.log(`✅ 获取到 ${likes.length} 条点赞记录，总计 ${total} 条`);

      res.json({
        success: true,
        data: {
          likes,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });

    } catch (dbError) {
      console.error('❌ 数据库查询失败:', dbError);
      return res.status(500).json({
        error: 'Database query failed',
        chinese: '数据库查询失败',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

  } catch (error) {
    console.error('❌ 获取点赞记录失败:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      stack: error.stack
    });
    
    res.status(500).json({
      error: 'Internal server error',
      chinese: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      'GET /api/tools/:toolId/likes - 获取工具点赞数',
      'POST /api/tools/:toolId/likes - 点赞工具',
      'DELETE /api/tools/:toolId/likes - 取消点赞工具',
      'GET /api/tools/likes/stats - 获取所有工具点赞统计',
      'POST /api/tools/batch-likes - 批量获取工具点赞数',
      'GET /api/admin/tool-likes - 获取工具点赞记录（需要认证）',
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
    
    // 初始化工具点赞数据库
    console.log('🔧 初始化工具点赞数据库...');
    await initToolLikesDatabase();
    console.log('✅ 工具点赞数据库初始化完成');
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log(`🚀 访问统计服务器启动成功`);
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`📊 健康检查: http://localhost:${PORT}/health`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
      console.log(`👍 工具点赞功能已启用`);
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
  if (messagePool) {
    await messagePool.end();
    console.log('✅ 留言板数据库连接池已关闭');
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 收到SIGINT信号，正在关闭服务器...');
  if (messagePool) {
    await messagePool.end();
    console.log('✅ 留言板数据库连接池已关闭');
  }
  process.exit(0);
});

// 启动服务器
startServer();

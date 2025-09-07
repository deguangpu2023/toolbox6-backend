const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise');
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
    'https://toolbox6-backend-production.up.railway.app/'
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

// 初始化留言板数据库
async function initMessageDatabase() {
  try {
    console.log('🔧 初始化留言板数据库...');
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
    console.log('✅ 留言板数据库连接成功');
    
    // 创建消息表（如果不存在）
    console.log('📝 创建消息表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ 消息表创建/检查完成');
    
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
      AND TABLE_NAME IN ('messages', 'tool_likes')
    `, [dbConfig.database]);
    
    console.log('📊 已创建的表:', tables.map(t => t.TABLE_NAME));
    
    connection.release();
    console.log('✅ 留言板数据库初始化完成');
  } catch (error) {
    console.error('❌ 留言板数据库连接失败:', error);
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
      'POST /api/messages - 提交留言',
      'GET /api/messages/stats - 获取留言统计（需要认证）',
      'GET /api/messages - 获取所有留言（需要认证）',
      'GET /api/admin/visits - 获取访问记录（需要认证）',
      'GET /api/tools/:toolId/likes - 获取工具点赞数',
      'POST /api/tools/:toolId/likes - 点赞工具',
      'DELETE /api/tools/:toolId/likes - 取消点赞工具',
      'GET /api/tools/likes/stats - 获取所有工具点赞统计',
      'GET /api/admin/tool-likes - 获取工具点赞记录（需要认证）',
      'GET /admin - 管理后台界面'
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

    // 检查留言板数据库
    try {
      if (messagePool) {
        const connection = await messagePool.getConnection();
        await connection.execute('SELECT 1');
        connection.release();
        health.services.messageDatabase = 'OK';
      } else {
        health.services.messageDatabase = 'NOT_INITIALIZED';
      }
    } catch (error) {
      health.services.messageDatabase = 'ERROR';
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

// 留言板API路由

// 提交留言
app.post('/api/messages', async (req, res) => {
  try {
    const { name, email, message, timestamp, userAgent } = req.body;
    
    // 输入验证
    if (!name || !email || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        chinese: '缺少必填字段'
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        chinese: '邮箱格式不正确'
      });
    }

    // 验证输入长度
    if (name.length > 100 || email.length > 255 || message.length > 1000) {
      return res.status(400).json({
        error: 'Input too long',
        chinese: '输入内容过长'
      });
    }

    // 获取客户端IP
    const clientIP = req.realIP;

    // 插入数据库
    const [result] = await messagePool.execute(
      'INSERT INTO messages (name, email, message, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.trim(), message.trim(), clientIP, userAgent || req.get('User-Agent')]
    );

    console.log(`✅ 新留言已保存: ID=${result.insertId}, 姓名=${name}, 邮箱=${email}`);

    res.status(201).json({
      success: true,
      message: 'Message submitted successfully',
      chinese: '留言提交成功',
      id: result.insertId
    });

  } catch (error) {
    console.error('❌ 保存留言失败:', error);
    res.status(500).json({
      error: 'Internal server error',
      chinese: '服务器内部错误'
    });
  }
});

// 获取留言统计（仅用于管理）
app.get('/api/messages/stats', async (req, res) => {
  try {
    console.log('🔍 获取留言统计请求');
    
    // 简单的认证检查（在实际应用中应该使用更安全的认证方式）
    const authHeader = req.headers.authorization;
    const expectedToken = `Bearer ${process.env.ADMIN_TOKEN || 'admin123'}`;
    
    console.log('认证头:', authHeader ? '已提供' : '未提供');
    console.log('期望令牌:', expectedToken);
    console.log('环境变量ADMIN_TOKEN:', process.env.ADMIN_TOKEN || '未设置');
    
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

    const [rows] = await messagePool.execute('SELECT COUNT(*) as total FROM messages');
    const [recentRows] = await messagePool.execute(
      'SELECT COUNT(*) as recent FROM messages WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );

    console.log('✅ 留言统计获取成功');

    res.json({
      total: rows[0].total,
      recent: recentRows[0].recent
    });

  } catch (error) {
    console.error('❌ 获取统计信息失败:', error);
    res.status(500).json({
      error: 'Internal server error',
      chinese: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 获取所有留言（仅用于管理）
app.get('/api/messages', async (req, res) => {
  try {
    console.log('🔍 获取留言列表请求');
    console.log('请求头:', req.headers);
    console.log('查询参数:', req.query);
    
    // 简单的认证检查
    const authHeader = req.headers.authorization;
    const expectedToken = `Bearer ${process.env.ADMIN_TOKEN || 'admin123'}`;
    
    console.log('认证头:', authHeader ? '已提供' : '未提供');
    console.log('期望令牌:', expectedToken);
    console.log('环境变量ADMIN_TOKEN:', process.env.ADMIN_TOKEN || '未设置');
    
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

    console.log(`📊 获取留言列表: page=${page}, limit=${limit}, offset=${offset}`);

    // 测试数据库连接
    let connection;
    try {
      connection = await messagePool.getConnection();
      console.log('✅ 数据库连接获取成功');
    } catch (connError) {
      console.error('❌ 获取数据库连接失败:', connError);
      return res.status(500).json({
        error: 'Database connection failed',
        chinese: '数据库连接失败',
        details: process.env.NODE_ENV === 'development' ? connError.message : undefined
      });
    }

    try {
      // 获取留言列表
      console.log('🔍 执行留言查询...');
      const [messages] = await connection.execute(
        'SELECT id, name, email, message, ip_address, user_agent, created_at FROM messages ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      console.log(`📊 查询到 ${messages.length} 条留言记录`);

      // 获取总数
      console.log('🔍 执行计数查询...');
      const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM messages');
      const total = countResult[0] ? countResult[0].total : 0;
      console.log(`📈 总留言数: ${total}`);

      console.log(`✅ 获取到 ${messages.length} 条留言，总计 ${total} 条`);

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });

    } finally {
      if (connection) {
        connection.release();
        console.log('✅ 数据库连接已释放');
      }
    }

  } catch (error) {
    console.error('❌ 获取留言列表失败:', error);
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
          AND TABLE_NAME IN ('messages', 'tool_likes')
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
      
      // 检查并创建 messages 表
      try {
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_created_at (created_at),
            INDEX idx_email (email)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        results.tables.messages = 'OK';
        console.log('✅ messages 表检查/创建完成');
      } catch (error) {
        results.tables.messages = 'ERROR';
        results.errors.push(`messages 表错误: ${error.message}`);
        console.error('❌ messages 表错误:', error);
      }

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
        AND TABLE_NAME IN ('messages', 'tool_likes')
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

    // 测试数据库连接
    let connection;
    try {
      connection = await messagePool.getConnection();
      console.log('✅ 数据库连接获取成功');
    } catch (connError) {
      console.error('❌ 获取数据库连接失败:', connError);
      return res.status(500).json({
        error: 'Database connection failed',
        chinese: '数据库连接失败',
        details: process.env.NODE_ENV === 'development' ? connError.message : undefined
      });
    }

    try {
      // 获取点赞记录
      console.log('🔍 执行点赞查询...');
      const [likes] = await connection.execute(
        'SELECT id, tool_id, ip_address, user_agent, created_at FROM tool_likes ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      console.log(`📊 查询到 ${likes.length} 条点赞记录`);

      // 获取总数
      console.log('🔍 执行计数查询...');
      const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM tool_likes');
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

    } finally {
      if (connection) {
        connection.release();
        console.log('✅ 数据库连接已释放');
      }
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
      'POST /api/messages - 提交留言',
      'GET /api/messages/stats - 获取留言统计（需要认证）',
      'GET /api/messages - 获取所有留言（需要认证）',
      'GET /api/admin/visits - 获取访问记录（需要认证）',
      'GET /api/tools/:toolId/likes - 获取工具点赞数',
      'POST /api/tools/:toolId/likes - 点赞工具',
      'DELETE /api/tools/:toolId/likes - 取消点赞工具',
      'GET /api/tools/likes/stats - 获取所有工具点赞统计',
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
    
    // 初始化留言板数据库
    console.log('🔧 初始化留言板数据库...');
    await initMessageDatabase();
    console.log('✅ 留言板数据库初始化完成');
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log(`🚀 访问统计服务器启动成功`);
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`📊 健康检查: http://localhost:${PORT}/health`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
      console.log(`💬 留言板功能已启用`);
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

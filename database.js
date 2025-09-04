const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'maglev.proxy.rlwy.net',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'EpZRllhApFMUenjfLOyXSilDPHFyGbPg',
  database: process.env.DB_NAME || 'railway',
  port: process.env.DB_PORT || 48332,
  charset: 'utf8mb4',
  timezone: '+08:00',
  // 连接池配置
  connectionLimit: 10,
  // 移除无效的配置选项
  // acquireTimeout: 60000,  // 这个选项在MySQL2中无效
  // timeout: 60000,        // 这个选项在MySQL2中无效
  // reconnect: true        // 这个选项在MySQL2中无效
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 初始化数据库表
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // 检查表是否存在，如果不存在则创建
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('visitor_stats', 'page_summary', 'daily_stats')
    `, [dbConfig.database]);
    
    if (tables.length === 0) {
      console.log('📊 初始化数据库表...');
      
      // 创建访问统计表
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS visitor_stats (
          id INT AUTO_INCREMENT PRIMARY KEY,
          page_url VARCHAR(255) NOT NULL,
          visitor_ip VARCHAR(45) NOT NULL,
          user_agent TEXT,
          referer VARCHAR(500),
          visit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_page_url (page_url),
          INDEX idx_visit_time (visit_time),
          INDEX idx_visitor_ip (visitor_ip)
        )
      `);
      
      // 创建页面统计汇总表
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS page_summary (
          id INT AUTO_INCREMENT PRIMARY KEY,
          page_url VARCHAR(255) NOT NULL UNIQUE,
          total_visits BIGINT DEFAULT 0,
          unique_visitors BIGINT DEFAULT 0,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_page_url (page_url)
        )
      `);
      
      // 创建每日访问统计表
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS daily_stats (
          id INT AUTO_INCREMENT PRIMARY KEY,
          date DATE NOT NULL,
          page_url VARCHAR(255) NOT NULL,
          visits INT DEFAULT 0,
          unique_visitors INT DEFAULT 0,
          UNIQUE KEY unique_date_page (date, page_url),
          INDEX idx_date (date),
          INDEX idx_page_url (page_url)
        )
      `);
      
      // 插入初始页面数据
      const pages = [
        '/home', '/colorto', '/colorpicker', '/colorcompare', '/commoncolors',
        '/imagetoico', '/imagetowebp', '/beautygallery', '/baby', '/EmojiPicker',
        '/muyu', '/worldtime', '/subtitle', '/ztpool', '/list', '/marketindex',
        '/Firework', '/blackcat', '/runner', '/redfish', '/handwriting'
      ];
      
      for (const page of pages) {
        await connection.execute(`
          INSERT INTO page_summary (page_url, total_visits, unique_visitors) 
          VALUES (?, 0, 0) 
          ON DUPLICATE KEY UPDATE total_visits = total_visits
        `, [page]);
      }
      
      console.log('✅ 数据库表初始化完成');
    } else {
      console.log('📊 数据库表已存在');
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection,
  initDatabase
};

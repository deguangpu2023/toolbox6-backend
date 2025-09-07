const { pool } = require('./database');

class VisitorService {
  // 记录访问
  async recordVisit(pageUrl, visitorIp, userAgent, referer) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // 1. 记录访问详情
      await connection.execute(`
        INSERT INTO visitor_stats (page_url, visitor_ip, user_agent, referer)
        VALUES (?, ?, ?, ?)
      `, [pageUrl, visitorIp, userAgent, referer]);
      
      // 2. 更新页面汇总统计
      await connection.execute(`
        UPDATE page_summary 
        SET total_visits = total_visits + 1,
            last_updated = CURRENT_TIMESTAMP
        WHERE page_url = ?
      `, [pageUrl]);
      
      // 3. 检查是否为唯一访问者（24小时内）
      const [uniqueVisitors] = await connection.execute(`
        SELECT COUNT(DISTINCT visitor_ip) as unique_count
        FROM visitor_stats 
        WHERE page_url = ? 
        AND visit_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `, [pageUrl]);
      
      // 4. 更新唯一访问者数量
      await connection.execute(`
        UPDATE page_summary 
        SET unique_visitors = ?
        WHERE page_url = ?
      `, [uniqueVisitors[0].unique_count, pageUrl]);
      
      // 5. 更新每日统计
      const today = new Date().toISOString().split('T')[0];
      await connection.execute(`
        INSERT INTO daily_stats (date, page_url, visits, unique_visitors)
        VALUES (?, ?, 1, ?)
        ON DUPLICATE KEY UPDATE 
          visits = visits + 1,
          unique_visitors = VALUES(unique_visitors)
      `, [today, pageUrl, uniqueVisitors[0].unique_count]);
      
      await connection.commit();
      
      return {
        success: true,
        message: '访问记录成功',
        uniqueVisitors: uniqueVisitors[0].unique_count
      };
      
    } catch (error) {
      await connection.rollback();
      console.error('记录访问失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // 获取页面统计
  async getPageStats(pageUrl) {
    try {
      const [rows] = await pool.execute(`
        SELECT total_visits, unique_visitors, last_updated
        FROM page_summary 
        WHERE page_url = ?
      `, [pageUrl]);
      
      if (rows.length === 0) {
        return {
          totalVisits: 0,
          uniqueVisitors: 0,
          lastUpdated: null
        };
      }
      
      return {
        totalVisits: rows[0].total_visits,
        uniqueVisitors: rows[0].unique_visitors,
        lastUpdated: rows[0].last_updated
      };
    } catch (error) {
      console.error('获取页面统计失败:', error);
      throw error;
    }
  }
  
  // 获取总体统计
  async getOverallStats() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          SUM(total_visits) as total_visits,
          SUM(unique_visitors) as total_unique_visitors,
          COUNT(*) as total_pages
        FROM page_summary
      `);
      
      // 获取今日访问量
      const today = new Date().toISOString().split('T')[0];
      const [todayStats] = await pool.execute(`
        SELECT SUM(visits) as today_visits
        FROM daily_stats 
        WHERE date = ?
      `, [today]);
      
      // 获取最近7天访问量
      const [weekStats] = await pool.execute(`
        SELECT SUM(visits) as week_visits
        FROM daily_stats 
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `);
      
      return {
        totalVisits: parseInt(rows[0].total_visits) || 0,
        totalUniqueVisitors: parseInt(rows[0].total_unique_visitors) || 0,
        totalPages: parseInt(rows[0].total_pages) || 0,
        todayVisits: parseInt(todayStats[0].today_visits) || 0,
        weekVisits: parseInt(weekStats[0].week_visits) || 0
      };
    } catch (error) {
      console.error('获取总体统计失败:', error);
      throw error;
    }
  }
  
  // 获取热门页面排行
  async getTopPages(limit = 10) {
    try {
      console.log(`🔍 获取热门页面排行: limit=${limit}`);
      
      // 确保limit是有效的数字
      const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
      
      const [rows] = await pool.execute(`
        SELECT page_url, total_visits, unique_visitors, last_updated
        FROM page_summary 
        WHERE total_visits > 0
        ORDER BY total_visits DESC 
        LIMIT ?
      `, [validLimit]);
      
      console.log(`📊 查询到 ${rows.length} 条页面记录`);
      
      // 如果没有数据，返回空数组而不是错误
      if (!rows || rows.length === 0) {
        console.log('热门页面查询：暂无访问数据');
        return [];
      }
      
      const result = rows.map(row => ({
        pageUrl: row.page_url || '',
        totalVisits: parseInt(row.total_visits) || 0,
        uniqueVisitors: parseInt(row.unique_visitors) || 0,
        lastUpdated: row.last_updated
      }));
      
      console.log(`✅ 返回 ${result.length} 条页面统计`);
      return result;
    } catch (error) {
      console.error('❌ 获取热门页面失败:', error);
      // 返回空数组而不是抛出错误，避免500错误
      return [];
    }
  }
  
  // 获取访问趋势（最近30天）
  async getVisitTrend(days = 30) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          date,
          SUM(visits) as daily_visits,
          SUM(unique_visitors) as daily_unique_visitors
        FROM daily_stats 
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY date 
        ORDER BY date ASC
      `, [days]);
      
      return rows.map(row => ({
        date: row.date,
        visits: parseInt(row.daily_visits) || 0,
        uniqueVisitors: parseInt(row.daily_unique_visitors) || 0
      }));
    } catch (error) {
      console.error('获取访问趋势失败:', error);
      throw error;
    }
  }
  
  // 清理旧数据（保留90天）
  async cleanupOldData() {
    try {
      const [result] = await pool.execute(`
        DELETE FROM visitor_stats 
        WHERE visit_time < DATE_SUB(NOW(), INTERVAL 90 DAY)
      `);
      
      console.log(`清理了 ${result.affectedRows} 条旧访问记录`);
      return result.affectedRows;
    } catch (error) {
      console.error('清理旧数据失败:', error);
      throw error;
    }
  }

  // 获取访问记录（分页）
  async getVisitRecords(limit = 50, offset = 0) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          id,
          page_url,
          visitor_ip,
          user_agent,
          referer,
          visit_time
        FROM visitor_stats 
        ORDER BY visit_time DESC 
        LIMIT ? OFFSET ?
      `, [limit, offset]);
      
      return rows.map(row => ({
        id: row.id,
        pageUrl: row.page_url,
        visitorIp: row.visitor_ip,
        userAgent: row.user_agent,
        referer: row.referer,
        visitTime: row.visit_time
      }));
    } catch (error) {
      console.error('获取访问记录失败:', error);
      throw error;
    }
  }

  // 获取访问记录总数
  async getTotalVisitCount() {
    try {
      const [rows] = await pool.execute(`
        SELECT COUNT(*) as total FROM visitor_stats
      `);
      
      return parseInt(rows[0].total) || 0;
    } catch (error) {
      console.error('获取访问记录总数失败:', error);
      throw error;
    }
  }
}

module.exports = new VisitorService();

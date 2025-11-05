const { pool } = require('./database');

class VisitorService {
  constructor() {
    // 简单的内存缓存
    this.cache = new Map();
    this.cacheTimeout = 1 * 60 * 1000; // 1分钟缓存，提高数据实时性
  }

  // 缓存管理
  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }
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
      
      // 2. 更新页面汇总统计（确保页面存在）
      await connection.execute(`
        INSERT INTO page_summary (page_url, total_visits, unique_visitors, last_updated)
        VALUES (?, 1, 0, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE 
          total_visits = total_visits + 1,
          last_updated = CURRENT_TIMESTAMP
      `, [pageUrl]);
      
      // 3. 计算该页面的历史唯一访客数（所有时间）
      const [uniqueVisitors] = await connection.execute(`
        SELECT COUNT(DISTINCT visitor_ip) as unique_count
        FROM visitor_stats 
        WHERE page_url = ?
      `, [pageUrl]);
      
      // 4. 更新唯一访问者数量（历史累计）
      await connection.execute(`
        UPDATE page_summary 
        SET unique_visitors = ?
        WHERE page_url = ?
      `, [uniqueVisitors[0].unique_count, pageUrl]);
      
      // 5. 更新每日统计 - 使用北京时间
      // 先尝试插入或更新每日访问记录（按北京时间日期聚合）
      await connection.execute(`
        INSERT INTO daily_stats (date, page_url, visits, unique_visitors)
        VALUES (DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00')), ?, 1, 0)
        ON DUPLICATE KEY UPDATE 
          visits = visits + 1
      `, [pageUrl]);
      
      // 然后重新计算今日该页面的唯一访客数
      const [todayUniqueVisitors] = await connection.execute(`
        SELECT COUNT(DISTINCT visitor_ip) as today_unique_count
        FROM visitor_stats 
        WHERE page_url = ? 
        AND DATE(CONVERT_TZ(visit_time, '+00:00', '+08:00')) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00'))
      `, [pageUrl]);
      
      // 更新唯一访客数
      await connection.execute(`
        UPDATE daily_stats 
        SET unique_visitors = ?
        WHERE date = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00')) AND page_url = ?
      `, [todayUniqueVisitors[0].today_unique_count, pageUrl]);
      
      await connection.commit();
      
      // 清除相关缓存
      this.clearCache(); // 清除所有缓存，因为访问记录会影响多个统计
      
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
      // 检查缓存
      const cacheKey = `page_stats_${pageUrl}`;
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log(`📊 从缓存获取页面统计: ${pageUrl}`);
        return cached;
      }

      const [rows] = await pool.execute(`
        SELECT total_visits, unique_visitors, last_updated
        FROM page_summary 
        WHERE page_url = ?
      `, [pageUrl]);
      
      let result;
      if (rows.length === 0) {
        result = {
          totalVisits: 0,
          uniqueVisitors: 0,
          lastUpdated: null
        };
      } else {
        result = {
          totalVisits: rows[0].total_visits,
          uniqueVisitors: rows[0].unique_visitors,
          lastUpdated: rows[0].last_updated
        };
      }

      // 缓存结果
      this.setCache(cacheKey, result);
      return result;
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
          COUNT(*) as total_pages
        FROM page_summary
      `);
      
      // 获取全站独立访客数（所有时间）
      const [uniqueVisitorsStats] = await pool.execute(`
        SELECT COUNT(DISTINCT visitor_ip) as total_unique_visitors
        FROM visitor_stats
      `);
      
      // 获取今日访问量和唯一访客数 - 使用北京时间（UTC+8）
      const [todayStats] = await pool.execute(`
        SELECT 
          COALESCE(SUM(visits), 0) as today_visits,
          COALESCE(SUM(unique_visitors), 0) as today_unique_visitors
        FROM daily_stats 
        WHERE date = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00'))
      `);
      
      // 获取最近7天访问量（含今天，共7天） - 使用北京时间（UTC+8）
      const [weekStats] = await pool.execute(`
        SELECT COALESCE(SUM(visits), 0) as week_visits
        FROM daily_stats 
        WHERE date BETWEEN DATE_SUB(DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00')), INTERVAL 6 DAY) 
                     AND DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00'))
      `);
      
      return {
        totalVisits: parseInt(rows[0].total_visits) || 0,
        totalUniqueVisitors: parseInt(uniqueVisitorsStats[0].total_unique_visitors) || 0,
        totalPages: parseInt(rows[0].total_pages) || 0,
        todayVisits: parseInt(todayStats[0].today_visits) || 0,
        todayUniqueVisitors: parseInt(todayStats[0].today_unique_visitors) || 0,
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
  
  // 获取访问趋势（最近N天）
  async getVisitTrend(days = 30) {
    try {
      // 先获取今天的日期（北京时间）
      const [todayRow] = await pool.execute(`
        SELECT DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00')) as today_date
      `);
      const todayDate = todayRow[0].today_date;
      
      // 获取有数据的日期统计 - 使用北京时间（UTC+8）
      const [rows] = await pool.execute(`
        SELECT 
          date,
          SUM(visits) as daily_visits,
          SUM(unique_visitors) as daily_unique_visitors
        FROM daily_stats 
        WHERE date >= DATE_SUB(?, INTERVAL ? DAY)
          AND date <= ?
        GROUP BY date 
        ORDER BY date ASC
      `, [todayDate, days - 1, todayDate]);
      
      // 创建日期到数据的映射
      const dataMap = new Map();
      rows.forEach(row => {
        // 确保日期格式为 YYYY-MM-DD
        const dateStr = row.date instanceof Date 
          ? row.date.toISOString().split('T')[0] 
          : String(row.date).split('T')[0];
        dataMap.set(dateStr, {
          visits: parseInt(row.daily_visits) || 0,
          uniqueVisitors: parseInt(row.daily_unique_visitors) || 0
        });
      });
      
      // 生成完整的日期序列（补全缺失的日期为0）
      const result = [];
      const today = new Date(todayDate);
      
      // 确保日期格式正确
      const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // 从 days-1 天前到今天，生成完整日期序列
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = formatDate(date);
        
        const data = dataMap.get(dateStr);
        result.push({
          date: dateStr,
          visits: data ? data.visits : 0,
          uniqueVisitors: data ? data.uniqueVisitors : 0
        });
      }
      
      return result;
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

  // 数据一致性检查和修复
  async checkAndFixDataConsistency() {
    try {
      console.log('🔍 开始数据一致性检查...');
      const results = {
        issues: [],
        fixes: [],
        timestamp: new Date().toISOString()
      };

      // 1. 检查page_summary表中的页面是否都有对应的访问记录
      const [orphanedPages] = await pool.execute(`
        SELECT ps.page_url, ps.total_visits
        FROM page_summary ps
        LEFT JOIN visitor_stats vs ON ps.page_url = vs.page_url
        WHERE vs.page_url IS NULL AND ps.total_visits > 0
      `);

      if (orphanedPages.length > 0) {
        results.issues.push(`发现 ${orphanedPages.length} 个页面有访问量但无访问记录`);
        // 修复：重置这些页面的访问量
        for (const page of orphanedPages) {
          await pool.execute(`
            UPDATE page_summary 
            SET total_visits = 0, unique_visitors = 0 
            WHERE page_url = ?
          `, [page.page_url]);
        }
        results.fixes.push(`重置了 ${orphanedPages.length} 个页面的访问量`);
      }

      // 2. 检查page_summary表中的访问量是否与实际访问记录一致
      const [inconsistentPages] = await pool.execute(`
        SELECT 
          ps.page_url,
          ps.total_visits as summary_visits,
          COUNT(vs.id) as actual_visits
        FROM page_summary ps
        LEFT JOIN visitor_stats vs ON ps.page_url = vs.page_url
        GROUP BY ps.page_url, ps.total_visits
        HAVING ps.total_visits != actual_visits
      `);

      if (inconsistentPages.length > 0) {
        results.issues.push(`发现 ${inconsistentPages.length} 个页面的访问量不一致`);
        // 修复：更新访问量
        for (const page of inconsistentPages) {
          await pool.execute(`
            UPDATE page_summary 
            SET total_visits = ? 
            WHERE page_url = ?
          `, [page.actual_visits, page.page_url]);
        }
        results.fixes.push(`修复了 ${inconsistentPages.length} 个页面的访问量`);
      }

      // 3. 检查daily_stats表中的数据是否与实际访问记录一致
      const [inconsistentDaily] = await pool.execute(`
        SELECT 
          ds.date,
          ds.page_url,
          ds.visits as daily_visits,
          COUNT(vs.id) as actual_visits
        FROM daily_stats ds
        LEFT JOIN visitor_stats vs ON ds.page_url = vs.page_url AND DATE(vs.visit_time) = ds.date
        GROUP BY ds.date, ds.page_url, ds.visits
        HAVING ds.visits != actual_visits
      `);

      if (inconsistentDaily.length > 0) {
        results.issues.push(`发现 ${inconsistentDaily.length} 个日期的访问量不一致`);
        // 修复：更新每日访问量
        for (const daily of inconsistentDaily) {
          await pool.execute(`
            UPDATE daily_stats 
            SET visits = ? 
            WHERE date = ? AND page_url = ?
          `, [daily.actual_visits, daily.date, daily.page_url]);
        }
        results.fixes.push(`修复了 ${inconsistentDaily.length} 个日期的访问量`);
      }

      // 4. 重新计算所有页面的唯一访客数
      const [allPages] = await pool.execute(`
        SELECT DISTINCT page_url FROM page_summary
      `);

      let uniqueVisitorFixes = 0;
      for (const page of allPages) {
        // 计算该页面的历史唯一访客数（所有时间）
        const [uniqueCount] = await pool.execute(`
          SELECT COUNT(DISTINCT visitor_ip) as unique_count
          FROM visitor_stats 
          WHERE page_url = ?
        `, [page.page_url]);

        await pool.execute(`
          UPDATE page_summary 
          SET unique_visitors = ? 
          WHERE page_url = ?
        `, [uniqueCount[0].unique_count, page.page_url]);
        uniqueVisitorFixes++;
      }

      if (uniqueVisitorFixes > 0) {
        results.fixes.push(`重新计算了 ${uniqueVisitorFixes} 个页面的唯一访客数`);
      }

      console.log('✅ 数据一致性检查完成:', results);
      return results;

    } catch (error) {
      console.error('❌ 数据一致性检查失败:', error);
      throw error;
    }
  }
}

module.exports = new VisitorService();

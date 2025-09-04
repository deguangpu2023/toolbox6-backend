-- 创建数据库
CREATE DATABASE IF NOT EXISTS toolbox_stats CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE toolbox_stats;

-- 创建访问统计表
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
);

-- 创建页面统计汇总表
CREATE TABLE IF NOT EXISTS page_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_url VARCHAR(255) NOT NULL UNIQUE,
    total_visits BIGINT DEFAULT 0,
    unique_visitors BIGINT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_page_url (page_url)
);

-- 创建每日访问统计表
CREATE TABLE IF NOT EXISTS daily_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    page_url VARCHAR(255) NOT NULL,
    visits INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    UNIQUE KEY unique_date_page (date, page_url),
    INDEX idx_date (date),
    INDEX idx_page_url (page_url)
);

-- 插入初始数据
INSERT INTO page_summary (page_url, total_visits, unique_visitors) VALUES 
('/home', 0, 0),
('/colorto', 0, 0),
('/colorpicker', 0, 0),
('/colorcompare', 0, 0),
('/commoncolors', 0, 0),
('/imagetoico', 0, 0),
('/imagetowebp', 0, 0),
('/beautygallery', 0, 0),
('/baby', 0, 0),
('/EmojiPicker', 0, 0),
('/muyu', 0, 0),
('/worldtime', 0, 0),
('/subtitle', 0, 0),
('/ztpool', 0, 0),
('/list', 0, 0),
('/marketindex', 0, 0),
('/Firework', 0, 0),
('/blackcat', 0, 0),
('/runner', 0, 0),
('/redfish', 0, 0),
('/handwriting', 0, 0)
ON DUPLICATE KEY UPDATE total_visits = total_visits;

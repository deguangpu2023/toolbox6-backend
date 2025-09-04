#!/usr/bin/env node

/**
 * 数据库连接测试脚本
 * 用于验证Railway MySQL数据库连接是否正常
 */

const { testConnection, initDatabase } = require('./database');

async function testDatabaseConnection() {
  console.log('🔍 开始测试数据库连接...\n');
  
  try {
    // 测试连接
    console.log('1️⃣ 测试数据库连接...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.log('❌ 数据库连接失败，请检查配置');
      process.exit(1);
    }
    
    // 初始化数据库表
    console.log('\n2️⃣ 初始化数据库表...');
    await initDatabase();
    
    console.log('\n✅ 数据库连接和初始化测试完成！');
    console.log('🎉 您的Railway MySQL数据库配置正确，可以正常使用！');
    
  } catch (error) {
    console.error('\n❌ 测试过程中出现错误:', error.message);
    console.error('请检查以下配置：');
    console.error('- DB_HOST: mysql.railway.internal');
    console.error('- DB_USER: root');
    console.error('- DB_PASSWORD: EpZRllhApFMUenjfLOyXSilDPHFyGbPg');
    console.error('- DB_NAME: railway');
    console.error('- DB_PORT: 3306');
    process.exit(1);
  }
}

// 运行测试
testDatabaseConnection();

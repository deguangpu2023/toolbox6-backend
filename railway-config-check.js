#!/usr/bin/env node

/**
 * Railway配置检查脚本
 * 检查Railway环境变量是否正确配置
 */

console.log('🔍 检查Railway环境变量配置...\n');

// 检查必需的环境变量
const requiredVars = [
  'DB_HOST',
  'DB_USER', 
  'DB_PASSWORD',
  'DB_NAME',
  'DB_PORT'
];

const optionalVars = [
  'NODE_ENV',
  'PORT',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS',
  'ADMIN_API_KEY'
];

console.log('📋 必需的环境变量:');
let allRequiredPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName === 'DB_PASSWORD' ? '***已设置***' : value}`);
  } else {
    console.log(`❌ ${varName}: 未设置`);
    allRequiredPresent = false;
  }
});

console.log('\n📋 可选的环境变量:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: 未设置 (使用默认值)`);
  }
});

console.log('\n🔧 当前数据库配置:');
console.log(`主机: ${process.env.DB_HOST || 'mysql.railway.internal'}`);
console.log(`用户: ${process.env.DB_USER || 'root'}`);
console.log(`密码: ${process.env.DB_PASSWORD ? '***已设置***' : 'EpZRllhApFMUenjfLOyXSilDPHFyGbPg'}`);
console.log(`数据库: ${process.env.DB_NAME || 'railway'}`);
console.log(`端口: ${process.env.DB_PORT || '3306'}`);

if (allRequiredPresent) {
  console.log('\n✅ 所有必需的环境变量都已配置！');
  console.log('🎉 您的Railway应用应该能够正常连接数据库！');
} else {
  console.log('\n❌ 缺少必需的环境变量！');
  console.log('请到Railway Dashboard的Variables标签页设置这些变量。');
}

console.log('\n📖 配置说明:');
console.log('1. 打开Railway Dashboard');
console.log('2. 选择您的应用服务');
console.log('3. 点击Variables标签页');
console.log('4. 添加上述环境变量');
console.log('5. 重启应用服务');

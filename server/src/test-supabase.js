const { Client } = require('pg');

async function testSupabasePooler(port) {
  const config = {
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    port: port,
    user: 'postgres.mknbgijsswpsabhgrnor',
    password: 'hw589426SB9',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  };

  console.log(`\n--- 正在通过 Pooler 连接 Supabase (端口: ${port}) ---`);
  const client = new Client(config);

  try {
    const startTime = Date.now();
    await client.connect();
    const duration = Date.now() - startTime;
    console.log(`✅ 连接成功！耗时: ${duration}ms`);
    
    const res = await client.query('SELECT version();');
    console.log('数据库版本:', res.rows[0].version.split(',')[0]);
    
    await client.end();
    return true;
  } catch (err) {
    console.error(`❌ 连接失败: ${err.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 开始 Supabase IPv4 Pooler 联通性测试...');
  
  // 按照 Supabase 官方建议，Pooler 端口通常尝试 5432 (Session) 或 6543 (Transaction)
  const ok5432 = await testSupabasePooler(5432);
  
  if (!ok5432) {
    console.log('\n💡 尝试 Pooler 备用端口 6543...');
    await testSupabasePooler(6543);
  }
}

runTests();

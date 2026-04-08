const { sequelize, User } = require('./models');
const { hashPassword } = require('./utils/password');

async function resetAdmin() {
  try {
    await sequelize.authenticate();
    console.log('--- 正在重置管理员账号 ---');
    
    // 强制同步 Users 表
    await User.sync({ alter: true });

    // 先删除已存在的（如果有）
    await User.destroy({ where: { email: 'admin@attendance.local' } });

    // 创建新的
    const hashedPw = await hashPassword('admin123');
    await User.create({
      name: '系统管理员',
      email: 'admin@attendance.local',
      password: hashedPw,
      role: 'admin',
      status: 'active',
      mustChangePassword: false
    });

    console.log('✅ 重置成功！');
    console.log('账号: admin@attendance.local');
    console.log('密码: admin123');
    process.exit(0);
  } catch (err) {
    console.error('❌ 重置失败:', err);
    process.exit(1);
  }
}

resetAdmin();

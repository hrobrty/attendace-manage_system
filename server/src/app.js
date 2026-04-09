const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./models');
const settingsService = require('./services/settings-service');
const emailQueue = require('./services/email-queue');
const errorHandler = require('./middleware/error-handler');
const seedDatabase = require('./seed');

// 路由
const authRoutes = require('./routes/auth-routes');
const userRoutes = require('./routes/user-routes');
const attendanceRoutes = require('./routes/attendance-routes');
const leaveRoutes = require('./routes/leave-routes');
const overtimeRoutes = require('./routes/overtime-routes');
const approvalRoutes = require('./routes/approval-routes');
const settingsRoutes = require('./routes/settings-routes');

const app = express();
const PORT = process.env.SERVER_PORT || 5000;

// ==================== 中间件 ====================
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// 静态文件（上传的附件）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==================== API 路由 ====================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave-requests', leaveRoutes);
app.use('/api/overtime-requests', overtimeRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/settings', settingsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== 错误处理 ====================
app.use(errorHandler);

// ==================== 启动 ====================
const start = async () => {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('[DB] PostgreSQL 连接成功');

    // NOTE: 开发环境自动同步表结构（生产环境应使用 migration）
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: false });
      console.log('[DB] 表结构同步完成');

      // 初始化种子数据
      await seedDatabase();
    }

    // 加载系统设置到缓存
    await settingsService.loadAll();

    // 启动邮件队列后台处理器
    emailQueue.start();

    const server = app.listen(PORT, () => {
      console.log(`[Server] 出勤管理系统后端运行于 http://localhost:${PORT}`);
    });

    // 优雅退出：停止队列处理器
    const shutdown = (signal) => {
      console.log(`[Server] 收到 ${signal}，正在关闭...`);
      emailQueue.stop();
      server.close(() => {
        console.log('[Server] HTTP 服务器已关闭');
        process.exit(0);
      });
    };
    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.once('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('[Server] 启动失败:', err);
    process.exit(1);
  }
};

start();

module.exports = app;

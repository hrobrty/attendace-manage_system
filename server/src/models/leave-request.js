const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const LeaveRequest = sequelize.define('LeaveRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
  },
  typeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'type_id',
    comment: '假别 ID',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date',
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'end_date',
  },
  startPeriod: {
    type: DataTypes.ENUM('morning', 'afternoon', 'full'),
    allowNull: false,
    defaultValue: 'full',
    field: 'start_period',
    comment: '起始半天标记（半天制用）',
  },
  endPeriod: {
    type: DataTypes.ENUM('morning', 'afternoon', 'full'),
    allowNull: false,
    defaultValue: 'full',
    field: 'end_period',
    comment: '结束半天标记',
  },
  totalDays: {
    type: DataTypes.DECIMAL(5, 1),
    allowNull: false,
    field: 'total_days',
    comment: '请假总天数',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '请假事由',
  },
  proxyUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'proxy_user_id',
    comment: '代理人 ID',
  },
  proxyStatus: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'none'),
    allowNull: false,
    defaultValue: 'none',
    field: 'proxy_status',
    comment: '代理人确认状态',
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  attachmentUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'attachment_url',
    comment: '附件路径',
  },
}, {
  tableName: 'leave_requests',
  underscored: true,
  timestamps: true,
});

module.exports = LeaveRequest;

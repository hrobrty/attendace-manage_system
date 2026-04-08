const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const OvertimeRequest = sequelize.define('OvertimeRequest', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '加班日期',
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'start_time',
    comment: '加班开始时间',
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'end_time',
    comment: '加班结束时间',
  },
  hours: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: false,
    comment: '加班时数',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '加班事由',
  },
  compHours: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: false,
    defaultValue: 0,
    field: 'comp_hours',
    comment: '产生的补休时数',
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
}, {
  tableName: 'overtime_requests',
  underscored: true,
  timestamps: true,
});

module.exports = OvertimeRequest;

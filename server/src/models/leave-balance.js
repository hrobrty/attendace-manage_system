const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const LeaveBalance = sequelize.define('LeaveBalance', {
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
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '年度',
  },
  totalDays: {
    type: DataTypes.DECIMAL(5, 1),
    allowNull: false,
    defaultValue: 0,
    field: 'total_days',
    comment: '总额度（天）',
  },
  usedDays: {
    type: DataTypes.DECIMAL(5, 1),
    allowNull: false,
    defaultValue: 0,
    field: 'used_days',
    comment: '已使用（天）',
  },
  pendingDays: {
    type: DataTypes.DECIMAL(5, 1),
    allowNull: false,
    defaultValue: 0,
    field: 'pending_days',
    comment: '待审预扣（天）',
  },
}, {
  tableName: 'leave_balances',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'type_id', 'year'],
    },
  ],
});

module.exports = LeaveBalance;

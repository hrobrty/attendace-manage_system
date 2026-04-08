const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ClockAmendment = sequelize.define('ClockAmendment', {
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
    comment: '补打卡日期',
  },
  clockType: {
    type: DataTypes.ENUM('clock_in', 'clock_out'),
    allowNull: false,
    field: 'clock_type',
  },
  amendedTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'amended_time',
    comment: '补打时间',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '补打卡原因',
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
}, {
  tableName: 'clock_amendments',
  underscored: true,
  timestamps: true,
});

module.exports = ClockAmendment;

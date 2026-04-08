const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Attendance = sequelize.define('Attendance', {
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
    comment: '打卡日期',
  },
  clockIn: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'clock_in',
    comment: '上班打卡时间',
  },
  clockOut: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'clock_out',
    comment: '下班打卡时间',
  },
  status: {
    type: DataTypes.ENUM('normal', 'late', 'early', 'late_early', 'missing_clock_in', 'missing_clock_out', 'absent', 'leave'),
    allowNull: false,
    defaultValue: 'normal',
    comment: '状态：正常/迟到/早退/迟到且早退/缺上班卡/缺下班卡/旷职/请假',
  },
  note: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '备注',
  },
}, {
  tableName: 'attendances',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'date'],
    },
  ],
});

module.exports = Attendance;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ApprovalFlow = sequelize.define('ApprovalFlow', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  requestType: {
    type: DataTypes.ENUM('leave', 'overtime', 'clock_amendment'),
    allowNull: false,
    field: 'request_type',
    comment: '关联的申请类型',
  },
  requestId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'request_id',
    comment: '关联的申请 ID',
  },
  currentLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'current_level',
    comment: '当前签核层级',
  },
  totalLevels: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'total_levels',
    comment: '总签核层级数',
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
}, {
  tableName: 'approval_flows',
  underscored: true,
  timestamps: true,
});

module.exports = ApprovalFlow;

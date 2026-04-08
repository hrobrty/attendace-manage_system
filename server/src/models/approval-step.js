const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ApprovalStep = sequelize.define('ApprovalStep', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  flowId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'flow_id',
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '签核层级（1 = 第一层）',
  },
  approverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'approver_id',
    comment: '审批人 ID',
  },
  proxyApproverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'proxy_approver_id',
    comment: '代理审批人 ID（当审批人请假时）',
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '审批意见',
  },
  actedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'acted_at',
    comment: '操作时间',
  },
}, {
  tableName: 'approval_steps',
  underscored: true,
  timestamps: true,
});

module.exports = ApprovalStep;

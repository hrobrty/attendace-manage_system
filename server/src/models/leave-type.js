const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const LeaveType = sequelize.define('LeaveType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '假别名称',
  },
  code: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '假别代码，如 annual, comp, personal',
  },
  hasQuota: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'has_quota',
    comment: '是否有额度限制',
  },
  deductPay: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'deduct_pay',
    comment: '是否扣薪',
  },
  needAttachment: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'need_attachment',
    comment: '是否需要附件证明',
  },
  genderSpecific: {
    type: DataTypes.ENUM('male', 'female', 'all'),
    allowNull: false,
    defaultValue: 'all',
    field: 'gender_specific',
    comment: '适用性别',
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_system',
    comment: '是否为内建假别（不可删除）',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  },
  defaultDays: {
    type: DataTypes.DECIMAL(5, 1),
    allowNull: true,
    field: 'default_days',
    comment: '默认额度天数',
  },
}, {
  tableName: 'leave_types',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['code']
    }
  ]
});

module.exports = LeaveType;

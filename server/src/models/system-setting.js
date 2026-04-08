const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const SystemSetting = sequelize.define('SystemSetting', {
  key: {
    type: DataTypes.STRING(100),
    primaryKey: true,
    comment: '配置键名',
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '配置值',
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '配置说明',
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'general',
    comment: '分类：attendance/leave/overtime/approval/proxy/notification/organization',
  },
}, {
  tableName: 'system_settings',
  underscored: true,
  timestamps: true,
});

module.exports = SystemSetting;

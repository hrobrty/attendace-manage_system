const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '用户姓名',
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '登入邮箱',
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'employee'),
    allowNull: false,
    defaultValue: 'employee',
  },
  approverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'approver_id',
    comment: '直属主管 ID',
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '部门名称',
  },
  hireDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'hire_date',
    comment: '入职日期',
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  },
  mustChangePassword: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'must_change_password',
    comment: '首次登入是否需要强制改密码',
  },
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true,
  // NOTE: 密码字段默认不返回
  defaultScope: {
    attributes: { exclude: ['password'] },
  },
  scopes: {
    withPassword: {
      attributes: {},
    },
  },
  indexes: [
    {
      unique: true,
      fields: ['email']
    }
  ]
});

module.exports = User;

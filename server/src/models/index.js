const sequelize = require('../config/sequelize');
const User = require('./user');
const SystemSetting = require('./system-setting');
const LeaveType = require('./leave-type');
const LeaveBalance = require('./leave-balance');
const Attendance = require('./attendance');
const LeaveRequest = require('./leave-request');
const OvertimeRequest = require('./overtime-request');
const ApprovalFlow = require('./approval-flow');
const ApprovalStep = require('./approval-step');
const ClockAmendment = require('./clock-amendment');

// ==================== 关联关系定义 ====================

// NOTE: 用户自关联 — 直属主管
User.belongsTo(User, { as: 'approver', foreignKey: 'approverId' });
User.hasMany(User, { as: 'subordinates', foreignKey: 'approverId' });

// 打卡记录
User.hasMany(Attendance, { foreignKey: 'userId' });
Attendance.belongsTo(User, { foreignKey: 'userId' });

// 假额度
User.hasMany(LeaveBalance, { foreignKey: 'userId' });
LeaveBalance.belongsTo(User, { foreignKey: 'userId' });
LeaveType.hasMany(LeaveBalance, { foreignKey: 'typeId' });
LeaveBalance.belongsTo(LeaveType, { foreignKey: 'typeId' });

// 请假申请
User.hasMany(LeaveRequest, { as: 'leaveRequests', foreignKey: 'userId' });
LeaveRequest.belongsTo(User, { as: 'applicant', foreignKey: 'userId' });
LeaveRequest.belongsTo(User, { as: 'proxyUser', foreignKey: 'proxyUserId' });
LeaveRequest.belongsTo(LeaveType, { foreignKey: 'typeId' });
LeaveType.hasMany(LeaveRequest, { foreignKey: 'typeId' });

// 加班申请
User.hasMany(OvertimeRequest, { foreignKey: 'userId' });
OvertimeRequest.belongsTo(User, { foreignKey: 'userId' });

// 签核流程
ApprovalFlow.hasMany(ApprovalStep, { as: 'steps', foreignKey: 'flowId' });
ApprovalStep.belongsTo(ApprovalFlow, { foreignKey: 'flowId' });
ApprovalStep.belongsTo(User, { as: 'approver', foreignKey: 'approverId' });
ApprovalStep.belongsTo(User, { as: 'proxyApprover', foreignKey: 'proxyApproverId' });

// 补打卡
User.hasMany(ClockAmendment, { foreignKey: 'userId' });
ClockAmendment.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  SystemSetting,
  LeaveType,
  LeaveBalance,
  Attendance,
  LeaveRequest,
  OvertimeRequest,
  ApprovalFlow,
  ApprovalStep,
  ClockAmendment,
};

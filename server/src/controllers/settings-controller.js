const settingsService = require('../services/settings-service');
const { SystemSetting, LeaveType } = require('../models');
const response = require('../utils/response');
const AppError = require('../utils/app-error');

/**
 * GET /api/settings
 * 获取所有系统设置（admin only）
 */
const getSettings = async (req, res) => {
  const settings = await settingsService.getAll();
  return response.success(res, settings);
};

/**
 * GET /api/settings/public
 * 获取公开设置（所有登入用户）
 */
const getPublicSettings = async (req, res) => {
  const settings = settingsService.getPublicSettings();
  return response.success(res, settings);
};

/**
 * PUT /api/settings
 * 批量更新设置（admin only）
 */
const updateSettings = async (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new AppError('请提供要更新的设置', 400);
  }
  await settingsService.bulkUpdate(updates);
  return response.success(res, null, '设置已更新');
};

// ==================== 假别管理 ====================

/**
 * GET /api/leave-types
 */
const getLeaveTypes = async (req, res) => {
  const where = {};
  if (req.user.role !== 'admin') {
    where.isActive = true;
  }
  const types = await LeaveType.findAll({ where, order: [['is_system', 'DESC'], ['name', 'ASC']] });
  return response.success(res, types);
};

/**
 * POST /api/leave-types
 */
const createLeaveType = async (req, res) => {
  const { name, code, hasQuota, deductPay, needAttachment, genderSpecific, defaultDays } = req.body;
  const leaveType = await LeaveType.create({
    name, code, hasQuota, deductPay, needAttachment,
    genderSpecific: genderSpecific || 'all',
    isSystem: false, isActive: true, defaultDays,
  });
  return response.success(res, leaveType, '假别创建成功', 201);
};

/**
 * PUT /api/leave-types/:id
 */
const updateLeaveType = async (req, res) => {
  const leaveType = await LeaveType.findByPk(req.params.id);
  if (!leaveType) throw new AppError('假别不存在', 404);

  const { name, hasQuota, deductPay, needAttachment, genderSpecific, defaultDays } = req.body;
  await leaveType.update({
    ...(name !== undefined && { name }),
    ...(hasQuota !== undefined && { hasQuota }),
    ...(deductPay !== undefined && { deductPay }),
    ...(needAttachment !== undefined && { needAttachment }),
    ...(genderSpecific !== undefined && { genderSpecific }),
    ...(defaultDays !== undefined && { defaultDays }),
  });
  return response.success(res, leaveType, '假别已更新');
};

/**
 * PUT /api/leave-types/:id/status
 */
const toggleLeaveTypeStatus = async (req, res) => {
  const leaveType = await LeaveType.findByPk(req.params.id);
  if (!leaveType) throw new AppError('假别不存在', 404);
  if (leaveType.isSystem) throw new AppError('内建假别不可停用', 400);

  await leaveType.update({ isActive: !leaveType.isActive });
  return response.success(res, leaveType, `假别已${leaveType.isActive ? '启用' : '停用'}`);
};

module.exports = { getSettings, getPublicSettings, updateSettings, getLeaveTypes, createLeaveType, updateLeaveType, toggleLeaveTypeStatus };

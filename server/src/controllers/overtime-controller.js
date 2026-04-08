const { OvertimeRequest, LeaveBalance, LeaveType, User, sequelize } = require('../models');
const approvalService = require('../services/approval-service');
const settingsService = require('../services/settings-service');
const response = require('../utils/response');
const AppError = require('../utils/app-error');
const { Op } = require('sequelize');

/**
 * POST /api/overtime-requests
 */
const createOvertimeRequest = async (req, res) => {
  const userId = req.user.userId;
  const { date, startTime, endTime, hours, reason } = req.body;

  // 检查月加班上限
  const monthlyCap = settingsService.getNumber('overtime_monthly_cap', 0);
  if (monthlyCap > 0) {
    const [year, month] = date.split('-');
    const startOfMonth = `${year}-${month}-01`;
    const endOfMonth = new Date(year, parseInt(month, 10), 0).toISOString().slice(0, 10);

    const monthlyTotal = await OvertimeRequest.sum('hours', {
      where: {
        userId,
        date: { [Op.between]: [startOfMonth, endOfMonth] },
        status: { [Op.in]: ['pending', 'approved'] },
      },
    }) || 0;

    if (monthlyTotal + hours > monthlyCap) {
      throw new AppError(`本月加班已达上限 ${monthlyCap} 小时`, 400, 'OVERTIME_CAP_EXCEEDED');
    }
  }

  const result = await sequelize.transaction(async (t) => {
    const overtime = await OvertimeRequest.create({
      userId, date, startTime, endTime, hours, reason, status: 'pending',
    }, { transaction: t });

    await approvalService.createFlow('overtime', overtime.id, userId, t);
    return overtime;
  });

  return response.success(res, result, '加班申请已提交', 201);
};

/**
 * GET /api/overtime-requests
 */
const getOvertimeRequests = async (req, res) => {
  const { role, userId } = req.user;
  const { page = 1, limit = 20, status } = req.query;

  const where = {};
  if (role === 'employee') where.userId = userId;
  if (status) where.status = status;

  const { rows, count } = await OvertimeRequest.findAndCountAll({
    where,
    include: [{ model: User, attributes: ['id', 'name', 'department'] }],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit, 10),
    offset: (page - 1) * limit,
  });

  return response.paginated(res, rows, { total: count, page: parseInt(page, 10), limit: parseInt(limit, 10) });
};

/**
 * GET /api/overtime-requests/summary
 * 本月加班统计
 */
const getMonthlySummary = async (req, res) => {
  const userId = req.query.userId || req.user.userId;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const startOfMonth = `${year}-${month}-01`;
  const endOfMonth = new Date(year, now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const approved = await OvertimeRequest.sum('hours', {
    where: { userId, date: { [Op.between]: [startOfMonth, endOfMonth] }, status: 'approved' },
  }) || 0;

  const pending = await OvertimeRequest.sum('hours', {
    where: { userId, date: { [Op.between]: [startOfMonth, endOfMonth] }, status: 'pending' },
  }) || 0;

  const compHours = await OvertimeRequest.sum('comp_hours', {
    where: { userId, date: { [Op.between]: [startOfMonth, endOfMonth] }, status: 'approved' },
  }) || 0;

  return response.success(res, { approvedHours: approved, pendingHours: pending, compHours, month: `${year}-${month}` });
};

module.exports = { createOvertimeRequest, getOvertimeRequests, getMonthlySummary };

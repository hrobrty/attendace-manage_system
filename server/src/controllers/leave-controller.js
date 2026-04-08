const { LeaveRequest, LeaveType, LeaveBalance, User, sequelize } = require('../models');
const approvalService = require('../services/approval-service');
const emailService = require('../services/email-service');
const settingsService = require('../services/settings-service');
const response = require('../utils/response');
const AppError = require('../utils/app-error');
const { Op } = require('sequelize');

/**
 * POST /api/leave-requests
 * 提交请假申请
 */
const createLeaveRequest = async (req, res) => {
  const userId = req.user.userId;
  const { typeId, startDate, endDate, startPeriod, endPeriod, totalDays, reason, proxyUserId } = req.body;

  // 检查代理人是否必填
  const proxyRequired = settingsService.getBool('proxy_required', true);
  if (proxyRequired && !proxyUserId) {
    throw new AppError('请选择职务代理人', 400, 'PROXY_REQUIRED');
  }

  // 检查假别
  const leaveType = await LeaveType.findByPk(typeId);
  if (!leaveType || !leaveType.isActive) {
    throw new AppError('假别不存在或已停用', 400, 'INVALID_LEAVE_TYPE');
  }

  // 检查日期重叠
  const overlap = await LeaveRequest.findOne({
    where: {
      userId,
      status: { [Op.in]: ['pending', 'approved'] },
      [Op.or]: [
        { startDate: { [Op.between]: [startDate, endDate] } },
        { endDate: { [Op.between]: [startDate, endDate] } },
        {
          [Op.and]: [
            { startDate: { [Op.lte]: startDate } },
            { endDate: { [Op.gte]: endDate } },
          ],
        },
      ],
    },
  });
  if (overlap) {
    throw new AppError('该日期已有请假记录', 400, 'DATE_OVERLAP');
  }

  // 检查额度（有额度限制的假别）
  if (leaveType.hasQuota) {
    const year = new Date(startDate).getFullYear();
    const balance = await LeaveBalance.findOne({
      where: { userId, typeId, year },
    });
    const available = balance ? parseFloat(balance.totalDays) - parseFloat(balance.usedDays) - parseFloat(balance.pendingDays) : 0;
    if (available < totalDays) {
      throw new AppError(`${leaveType.name}额度不足，剩余 ${available} 天`, 400, 'INSUFFICIENT_BALANCE');
    }
  }

  // NOTE: 使用事务确保请假创建、额度预扣、签核流程的原子性
  const result = await sequelize.transaction(async (t) => {
    const leaveRequest = await LeaveRequest.create({
      userId,
      typeId,
      startDate,
      endDate,
      startPeriod: startPeriod || 'full',
      endPeriod: endPeriod || 'full',
      totalDays,
      reason,
      proxyUserId: proxyUserId || null,
      proxyStatus: proxyUserId ? 'pending' : 'none',
      status: 'pending',
    }, { transaction: t });

    // 额度预扣
    if (leaveType.hasQuota) {
      const year = new Date(startDate).getFullYear();
      await LeaveBalance.increment(
        { pendingDays: totalDays },
        { where: { userId, typeId, year }, transaction: t }
      );
    }

    // 创建签核流程
    await approvalService.createFlow('leave', leaveRequest.id, userId, t);

    return leaveRequest;
  });

  // 异步通知审批人
  if (settingsService.getBool('email_on_leave_submit', true)) {
    const user = await User.findByPk(userId, { attributes: ['name'] });
    const approver = await User.findByPk(
      (await User.findByPk(userId, { attributes: ['approverId'] }))?.approverId
    );
    if (approver) {
      emailService.sendLeaveSubmitNotice(
        approver.email, approver.name, user.name,
        leaveType.name, startDate, endDate
      ).catch((err) => console.error('[leaveRequest] 通知审批人失败:', err));
    }
  }

  return response.success(res, result, '请假申请已提交', 201);
};

/**
 * GET /api/leave-requests
 */
const getLeaveRequests = async (req, res) => {
  const { role, userId } = req.user;
  const { page = 1, limit = 20, status, targetUserId } = req.query;

  const where = {};
  if (role === 'employee') {
    where.userId = userId;
  } else if (targetUserId) {
    where.userId = parseInt(targetUserId, 10);
  }
  if (status) where.status = status;

  const { rows, count } = await LeaveRequest.findAndCountAll({
    where,
    include: [
      { model: User, as: 'applicant', attributes: ['id', 'name', 'department'] },
      { model: User, as: 'proxyUser', attributes: ['id', 'name'] },
      { model: LeaveType, attributes: ['id', 'name', 'code'] },
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit, 10),
    offset: (page - 1) * limit,
  });

  return response.paginated(res, rows, {
    total: count,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(count / limit),
  });
};

/**
 * GET /api/leave-requests/:id
 */
const getLeaveRequest = async (req, res) => {
  const leaveRequest = await LeaveRequest.findByPk(req.params.id, {
    include: [
      { model: User, as: 'applicant', attributes: ['id', 'name', 'email', 'department'] },
      { model: User, as: 'proxyUser', attributes: ['id', 'name'] },
      { model: LeaveType },
    ],
  });
  if (!leaveRequest) throw new AppError('请假申请不存在', 404);

  // 附带签核历史
  const approvalFlow = await approvalService.findByRequest('leave', leaveRequest.id);

  return response.success(res, { ...leaveRequest.toJSON(), approvalFlow });
};

/**
 * PUT /api/leave-requests/:id/cancel
 */
const cancelLeaveRequest = async (req, res) => {
  const leaveRequest = await LeaveRequest.findByPk(req.params.id);
  if (!leaveRequest) throw new AppError('请假申请不存在', 404);
  if (leaveRequest.userId !== req.user.userId) throw new AppError('无权操作', 403);
  if (leaveRequest.status !== 'pending') {
    throw new AppError('已核准的请假无法直接取消，请联系管理者', 400, 'CANNOT_CANCEL');
  }

  await sequelize.transaction(async (t) => {
    await leaveRequest.update({ status: 'cancelled' }, { transaction: t });

    // 返还预扣额度
    const leaveType = await LeaveType.findByPk(leaveRequest.typeId);
    if (leaveType?.hasQuota) {
      const year = new Date(leaveRequest.startDate).getFullYear();
      await LeaveBalance.decrement(
        { pendingDays: leaveRequest.totalDays },
        { where: { userId: leaveRequest.userId, typeId: leaveRequest.typeId, year }, transaction: t }
      );
    }
  });

  return response.success(res, null, '请假申请已取消');
};

/**
 * GET /api/leave-balances
 */
const getLeaveBalances = async (req, res) => {
  const userId = req.query.userId || req.user.userId;
  const year = req.query.year || new Date().getFullYear();

  // 权限检查
  if (parseInt(userId, 10) !== req.user.userId && req.user.role === 'employee') {
    throw new AppError('无权查看他人假额度', 403);
  }

  const balances = await LeaveBalance.findAll({
    where: { userId, year },
    include: [{ model: LeaveType, attributes: ['id', 'name', 'code'] }],
  });

  return response.success(res, balances);
};

module.exports = { createLeaveRequest, getLeaveRequests, getLeaveRequest, cancelLeaveRequest, getLeaveBalances };

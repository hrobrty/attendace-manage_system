const { ClockAmendment, Attendance, SystemSetting, sequelize, User } = require('../models');
const settingsService = require('../services/settings-service');
const approvalService = require('../services/approval-service');
const response = require('../utils/response');
const AppError = require('../utils/app-error');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

/**
 * POST /api/attendance/amendments
 * 提交补打卡申请
 */
const createAmendment = async (req, res) => {
  try {
    const { userId } = req.user;
    const { date, clockType, amendedTime, reason } = req.body;

    console.log(`[Amendment] 收到申请: user=${userId}, date=${date}, type=${clockType}`);

    // 1. 检查开关
    const enabled = settingsService.get('clock_amendment_enabled') === 'true';
    if (!enabled) throw new AppError('补打卡功能尚未开启', 403);

    // 2. 检查追溯期 (Deadline)
    const deadlineDays = parseInt(settingsService.get('amendment_deadline_days') || '3', 10);
    const diffDays = dayjs().diff(dayjs(date), 'day');
    if (diffDays > deadlineDays) {
      throw new AppError(`申请已超过追溯期（限 ${deadlineDays} 天内）`, 400);
    }

    // 3. 弹性规则：检查月度自助额度
    const autoApproveEnabled = settingsService.get('amendment_auto_approve_if_quota') === 'true';
    const monthlyQuota = parseInt(settingsService.get('amendment_monthly_quota') || '3', 10);

    const startOfMonth = dayjs(date).startOf('month').toDate();
    const endOfMonth = dayjs(date).endOf('month').toDate();

    // 统计当月已通过的补打卡次数
    const usedCount = await ClockAmendment.count({
      where: {
        userId,
        status: 'approved',
        date: { [Op.between]: [startOfMonth, endOfMonth] }
      }
    });

    let status = 'pending';
    let message = '申请已提交，等待主管审批';

    if (autoApproveEnabled && usedCount < monthlyQuota) {
      status = 'approved';
      message = `申请已自动通过（本月剩余自助额度: ${monthlyQuota - usedCount - 1} 次）`;
    }

    const transaction = await sequelize.transaction();
    try {
      const amendment = await ClockAmendment.create({
        userId,
        date,
        clockType,
        amendedTime,
        reason,
        status
      }, { transaction });

      // 4. 自动通过 vs 手动审批
      if (status === 'approved') {
        // 自动通过，立即同步到考勤表
        await syncToAttendance(userId, date, clockType, amendedTime, transaction);
      } else {
        // 进入审批流程
        await approvalService.createFlow('clock_amendment', amendment.id, userId, transaction);
      }

      await transaction.commit();
      console.log(`[Amendment] 提交成功: ${amendment.id}, status=${status}`);
      return response.success(res, amendment, message, 201);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('[AmendmentError]', err);
    throw err; // 继续抛出，由全局错误处理器统一处理 500/400
  }
};

/**
 * 同步补打卡数据到考勤记录
 */
async function syncToAttendance(userId, date, clockType, amendedTime, transaction) {
  const [attendance] = await Attendance.findOrCreate({
    where: { userId, date },
    defaults: { userId, date, status: 'normal' },
    transaction
  });

  const updateField = clockType === 'clock_in' ? 'clockIn' : 'clockOut';
  await attendance.update({ [updateField]: amendedTime }, { transaction });
}

/**
 * GET /api/attendance/amendments/my
 * 我的申请历史
 */
const getMyAmendments = async (req, res) => {
  try {
    const amendments = await ClockAmendment.findAll({
      where: { userId: req.user.userId },
      order: [['createdAt', 'DESC']] // Fix: use attribute name instead of field name
    });
    return response.success(res, amendments);
  } catch (err) {
    console.error('[GetAmendmentsError]', err);
    throw err;
  }
};

module.exports = {
  createAmendment,
  getMyAmendments
};

const { Attendance } = require('../models');
const settingsService = require('../services/settings-service');
const response = require('../utils/response');
const AppError = require('../utils/app-error');
const { Op } = require('sequelize');

/**
 * 辅助：根据系统设置判定打卡状态
 */
const determineClockInStatus = (clockTime) => {
  const workStartStr = settingsService.get('work_start_time', '09:00');
  const graceMinutes = settingsService.getNumber('late_grace_minutes', 0);
  const flexEnabled = settingsService.getBool('flexible_hours_enabled', false);
  const flexStart = settingsService.get('flexible_start', '08:00');
  const flexEnd = settingsService.get('flexible_end', '10:00');

  const clockDate = new Date(clockTime);
  const timeStr = clockDate.toTimeString().slice(0, 5); // HH:MM

  if (flexEnabled) {
    // NOTE: 弹性工时模式 — 在弹性区间内均为正常
    if (timeStr <= flexEnd) return 'normal';
    return 'late';
  }

  // 固定工时 — 检查是否迟到（含容许分钟）
  const [h, m] = workStartStr.split(':').map(Number);
  const deadline = new Date(clockDate);
  deadline.setHours(h, m + graceMinutes, 0, 0);

  return clockDate <= deadline ? 'normal' : 'late';
};

const determineClockOutStatus = (clockTime) => {
  const workEndStr = settingsService.get('work_end_time', '18:00');
  const clockDate = new Date(clockTime);
  const timeStr = clockDate.toTimeString().slice(0, 5);

  return timeStr >= workEndStr ? 'normal' : 'early';
};

/**
 * POST /api/attendance/clock-in
 */
const clockIn = async (req, res) => {
  const userId = req.user.userId;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const existing = await Attendance.findOne({ where: { userId, date: today } });
  if (existing?.clockIn) {
    throw new AppError('今日已完成上班打卡', 400, 'ALREADY_CLOCKED_IN');
  }

  const status = determineClockInStatus(now);

  let record;
  if (existing) {
    await existing.update({ clockIn: now, status });
    record = existing;
  } else {
    record = await Attendance.create({ userId, date: today, clockIn: now, status });
  }

  return response.success(res, record, status === 'late' ? '打卡成功（迟到）' : '上班打卡成功');
};

/**
 * POST /api/attendance/clock-out
 */
const clockOut = async (req, res) => {
  const userId = req.user.userId;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const existing = await Attendance.findOne({ where: { userId, date: today } });
  if (!existing?.clockIn) {
    throw new AppError('请先完成上班打卡', 400, 'NO_CLOCK_IN');
  }
  if (existing.clockOut) {
    throw new AppError('今日已完成下班打卡', 400, 'ALREADY_CLOCKED_OUT');
  }

  const outStatus = determineClockOutStatus(now);

  // NOTE: 综合判定（可能既迟到又早退）
  let finalStatus = existing.status;
  if (existing.status === 'late' && outStatus === 'early') {
    finalStatus = 'late_early';
  } else if (outStatus === 'early') {
    finalStatus = 'early';
  }
  // 如果上班正常且下班也正常，保持 normal

  await existing.update({ clockOut: now, status: finalStatus });
  return response.success(res, existing, outStatus === 'early' ? '打卡成功（早退）' : '下班打卡成功');
};

/**
 * GET /api/attendance/today
 */
const getToday = async (req, res) => {
  const userId = req.user.userId;
  const today = new Date().toISOString().slice(0, 10);
  const record = await Attendance.findOne({ where: { userId, date: today } });
  return response.success(res, record);
};

/**
 * GET /api/attendance
 * 查看打卡记录（支持月份筛选）
 */
const getRecords = async (req, res) => {
  const { role, userId } = req.user;
  const { year, month, targetUserId, page = 1, limit = 31 } = req.query;

  const where = {};

  // 权限控制
  if (role === 'employee') {
    where.userId = userId;
  } else if (targetUserId) {
    where.userId = parseInt(targetUserId, 10);
  }

  // 日期筛选
  if (year && month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().slice(0, 10);
    where.date = { [Op.between]: [startDate, endDate] };
  }

  const { rows, count } = await Attendance.findAndCountAll({
    where,
    order: [['date', 'DESC']],
    limit: parseInt(limit, 10),
    offset: (page - 1) * limit,
  });

  return response.paginated(res, rows, {
    total: count,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });
};

module.exports = { clockIn, clockOut, getToday, getRecords };

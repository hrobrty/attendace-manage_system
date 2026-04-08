const { ApprovalFlow, ApprovalStep, LeaveRequest, OvertimeRequest, ClockAmendment, Attendance, LeaveBalance, LeaveType, User, sequelize } = require('../models');
const approvalService = require('../services/approval-service');
const emailService = require('../services/email-service');
const settingsService = require('../services/settings-service');
const response = require('../utils/response');
const AppError = require('../utils/app-error');

/**
 * GET /api/approvals/pending
 * 待审列表
 */
const getPending = async (req, res) => {
  const approverId = req.user.userId;
  const pendingSteps = await approvalService.getPendingForApprover(approverId);

  // 补充关联的申请详情
  const results = [];
  for (const step of pendingSteps) {
    const flow = step.ApprovalFlow;
    let requestDetail = null;

    if (flow.requestType === 'leave') {
      requestDetail = await LeaveRequest.findByPk(flow.requestId, {
        include: [
          { model: User, as: 'applicant', attributes: ['id', 'name', 'department'] },
          { model: LeaveType, attributes: ['id', 'name'] },
        ],
      });
    } else if (flow.requestType === 'overtime') {
      requestDetail = await OvertimeRequest.findByPk(flow.requestId, {
        include: [{ model: User, attributes: ['id', 'name', 'department'] }],
      });
    } else if (flow.requestType === 'clock_amendment') {
      requestDetail = await ClockAmendment.findByPk(flow.requestId, {
        include: [{ model: User, attributes: ['id', 'name', 'department'] }],
      });
    }

    results.push({
      stepId: step.id,
      flowId: flow.id,
      requestType: flow.requestType,
      currentLevel: flow.currentLevel,
      totalLevels: flow.totalLevels,
      request: requestDetail,
      createdAt: step.created_at,
    });
  }

  return response.success(res, results);
};

/**
 * PUT /api/approvals/:flowId/approve
 */
const approve = async (req, res) => {
  const { flowId } = req.params;
  const { comment } = req.body;
  const approverId = req.user.userId;

  const { flow, isComplete } = await sequelize.transaction(async (t) => {
    return approvalService.approve(parseInt(flowId, 10), approverId, comment, t);
  });

  // NOTE: 签核完成后的回调处理
  if (isComplete) {
    await handleApprovalComplete(flow, 'approved');
  }

  return response.success(res, { flowId: flow.id, isComplete }, isComplete ? '审批通过，流程完成' : '审批通过，已流转至下一层');
};

/**
 * PUT /api/approvals/:flowId/reject
 */
const reject = async (req, res) => {
  const { flowId } = req.params;
  const { comment } = req.body;
  const approverId = req.user.userId;

  const { flow } = await sequelize.transaction(async (t) => {
    return approvalService.reject(parseInt(flowId, 10), approverId, comment, t);
  });

  await handleApprovalComplete(flow, 'rejected', comment);

  return response.success(res, { flowId: flow.id }, '已驳回');
};

/**
 * 签核完成后处理（更新请假/加班状态、额度扣除/返还、通知）
 */
const handleApprovalComplete = async (flow, result, rejectReason = '') => {
  const isApproved = result === 'approved';

  if (flow.requestType === 'leave') {
    const leaveRequest = await LeaveRequest.findByPk(flow.requestId, {
      include: [{ model: LeaveType }],
    });
    if (!leaveRequest) return;

    await leaveRequest.update({ status: isApproved ? 'approved' : 'rejected' });

    const leaveType = leaveRequest.LeaveType;
    const year = new Date(leaveRequest.startDate).getFullYear();

    if (leaveType?.hasQuota) {
      if (isApproved) {
        // 预扣转正式扣除
        await LeaveBalance.increment(
          { usedDays: leaveRequest.totalDays },
          { where: { userId: leaveRequest.userId, typeId: leaveRequest.typeId, year } }
        );
        await LeaveBalance.decrement(
          { pendingDays: leaveRequest.totalDays },
          { where: { userId: leaveRequest.userId, typeId: leaveRequest.typeId, year } }
        );
      } else {
        // 驳回 → 返还预扣
        await LeaveBalance.decrement(
          { pendingDays: leaveRequest.totalDays },
          { where: { userId: leaveRequest.userId, typeId: leaveRequest.typeId, year } }
        );
      }
    }

    // 核准后通知代理人
    if (isApproved && leaveRequest.proxyUserId) {
      const applicant = await User.findByPk(leaveRequest.userId, { attributes: ['name'] });
      const proxy = await User.findByPk(leaveRequest.proxyUserId);
      if (proxy) {
        emailService.sendProxyNotice(
          proxy.email, proxy.name, applicant.name,
          leaveRequest.startDate, leaveRequest.endDate
        ).catch((err) => console.error('[approval] 代理人通知失败:', err));
      }
    }

    // Email 通知申请人
    if (settingsService.getBool('email_on_approval', true)) {
      const applicant = await User.findByPk(leaveRequest.userId);
      if (applicant) {
        emailService.sendApprovalResult(
          applicant.email, applicant.name, '请假', result, rejectReason
        ).catch((err) => console.error('[approval] 通知申请人失败:', err));
      }
    }
  }

  if (flow.requestType === 'overtime') {
    const overtime = await OvertimeRequest.findByPk(flow.requestId);
    if (!overtime) return;

    await overtime.update({ status: isApproved ? 'approved' : 'rejected' });

    // NOTE: 加班核准后自动产生补休额度
    if (isApproved && settingsService.getBool('overtime_to_comp', true)) {
      const ratio = settingsService.getNumber('comp_ratio', 1.0);
      const compHours = parseFloat(overtime.hours) * ratio;
      await overtime.update({ compHours });

      // 累加到补休额度（按天计算：8小时=1天）
      const compType = await LeaveType.findOne({ where: { code: 'comp' } });
      if (compType) {
        const year = new Date(overtime.date).getFullYear();
        const compDays = compHours / 8;
        const [balance] = await LeaveBalance.findOrCreate({
          where: { userId: overtime.userId, typeId: compType.id, year },
          defaults: { totalDays: 0, usedDays: 0, pendingDays: 0 },
        });
        await balance.increment({ totalDays: compDays });
      }
    }

    if (settingsService.getBool('email_on_approval', true)) {
      const applicant = await User.findByPk(overtime.userId);
      if (applicant) {
        emailService.sendApprovalResult(
          applicant.email, applicant.name, '加班', result, rejectReason
        ).catch((err) => console.error('[approval] 通知申请人失败:', err));
      }
    }
  }

  if (flow.requestType === 'clock_amendment') {
    const amendment = await ClockAmendment.findByPk(flow.requestId);
    if (!amendment) return;

    await amendment.update({ status: isApproved ? 'approved' : 'rejected' });

    if (isApproved) {
      // 成功通过人工审批，同步到考勤表
      const [attendance] = await Attendance.findOrCreate({
        where: { userId: amendment.userId, date: amendment.date },
        defaults: { userId: amendment.userId, date: amendment.date, status: 'normal' }
      });

      const updateField = amendment.clockType === 'clock_in' ? 'clockIn' : 'clockOut';
      await attendance.update({ [updateField]: amendment.amendedTime });
    }

    if (settingsService.getBool('email_on_approval', true)) {
      const applicant = await User.findByPk(amendment.userId);
      if (applicant) {
        emailService.sendApprovalResult(
          applicant.email, applicant.name, '补打卡', result, rejectReason
        ).catch((err) => console.error('[approval] 通知申请人失败:', err));
      }
    }
  }
};

module.exports = { getPending, approve, reject };

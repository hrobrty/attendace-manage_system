const { ApprovalFlow, ApprovalStep, User } = require('../models');
const settingsService = require('./settings-service');
const AppError = require('../utils/app-error');

/**
 * 签核流程服务
 * 处理创建、推进、驳回签核流程的核心逻辑
 */
class ApprovalService {
  /**
   * 创建签核流程
   * @param {string} requestType 'leave' | 'overtime' | 'clock_amendment'
   * @param {number} requestId 关联申请的 ID
   * @param {number} applicantId 申请人 ID
   * @param {import('sequelize').Transaction} [transaction] 事务
   * @returns {Promise<object>} 创建的 approval flow
   */
  async createFlow(requestType, requestId, applicantId, transaction = null) {
    const totalLevels = settingsService.getNumber('approval_levels', 1);

    // NOTE: 通过 approver 链逐级推导审批人
    const approvers = await this.resolveApproverChain(applicantId, totalLevels);
    if (approvers.length === 0) {
      throw new AppError('无法创建签核流程：未设定直属主管', 400, 'NO_APPROVER');
    }

    const actualLevels = Math.min(totalLevels, approvers.length);

    const flow = await ApprovalFlow.create({
      requestType,
      requestId,
      currentLevel: 1,
      totalLevels: actualLevels,
      status: 'pending',
    }, { transaction });

    // 创建每层签核步骤
    for (let i = 0; i < actualLevels; i++) {
      await ApprovalStep.create({
        flowId: flow.id,
        level: i + 1,
        approverId: approvers[i].id,
        status: i === 0 ? 'pending' : 'pending',
      }, { transaction });
    }

    return flow;
  }

  /**
   * 推导审批人链
   * 从申请人的 approver 逐级向上获取 N 层审批人
   */
  async resolveApproverChain(userId, levels) {
    const chain = [];
    let currentUserId = userId;

    for (let i = 0; i < levels; i++) {
      const user = await User.findByPk(currentUserId, {
        attributes: ['id', 'approverId'],
      });
      if (!user?.approverId) break;

      const approver = await User.findByPk(user.approverId, {
        attributes: ['id', 'name', 'email', 'status'],
      });
      if (!approver || approver.status === 'inactive') break;

      chain.push(approver);
      currentUserId = approver.id;
    }

    return chain;
  }

  /**
   * 审批通过
   * @param {number} flowId 签核流程 ID
   * @param {number} approverId 操作人 ID
   * @param {string} [comment] 审批意见
   * @param {import('sequelize').Transaction} [transaction]
   * @returns {Promise<{flow: object, isComplete: boolean}>}
   */
  async approve(flowId, approverId, comment = '', transaction = null) {
    const flow = await ApprovalFlow.findByPk(flowId, {
      include: [{ model: ApprovalStep, as: 'steps', order: [['level', 'ASC']] }],
      transaction,
    });

    if (!flow) throw new AppError('签核流程不存在', 404, 'FLOW_NOT_FOUND');
    if (flow.status !== 'pending') throw new AppError('此签核流程已结束', 400, 'FLOW_CLOSED');

    // 找到当前层级的 step
    const currentStep = flow.steps.find((s) => s.level === flow.currentLevel && s.status === 'pending');
    if (!currentStep) throw new AppError('当前层级无待审步骤', 400, 'NO_PENDING_STEP');

    // NOTE: 检查操作人是否为该步骤的审批人或代理审批人
    const isAuthorized = currentStep.approverId === approverId || currentStep.proxyApproverId === approverId;
    if (!isAuthorized) throw new AppError('您无权审批此申请', 403, 'NOT_AUTHORIZED');

    // 更新当前步骤
    await currentStep.update({
      status: 'approved',
      comment,
      actedAt: new Date(),
    }, { transaction });

    // 判断是否还有下一层
    const isLastLevel = flow.currentLevel >= flow.totalLevels;
    if (isLastLevel) {
      await flow.update({ status: 'approved' }, { transaction });
      return { flow, isComplete: true };
    }

    // 推进到下一层
    await flow.update({ currentLevel: flow.currentLevel + 1 }, { transaction });
    return { flow, isComplete: false };
  }

  /**
   * 驳回
   */
  async reject(flowId, approverId, comment = '', transaction = null) {
    const flow = await ApprovalFlow.findByPk(flowId, {
      include: [{ model: ApprovalStep, as: 'steps' }],
      transaction,
    });

    if (!flow) throw new AppError('签核流程不存在', 404, 'FLOW_NOT_FOUND');
    if (flow.status !== 'pending') throw new AppError('此签核流程已结束', 400, 'FLOW_CLOSED');

    const currentStep = flow.steps.find((s) => s.level === flow.currentLevel && s.status === 'pending');
    if (!currentStep) throw new AppError('当前层级无待审步骤', 400, 'NO_PENDING_STEP');

    const isAuthorized = currentStep.approverId === approverId || currentStep.proxyApproverId === approverId;
    if (!isAuthorized) throw new AppError('您无权审批此申请', 403, 'NOT_AUTHORIZED');

    await currentStep.update({
      status: 'rejected',
      comment,
      actedAt: new Date(),
    }, { transaction });

    // NOTE: 任一层驳回 → 整个流程驳回
    await flow.update({ status: 'rejected' }, { transaction });

    return { flow, isComplete: true };
  }

  /**
   * 查找关联某申请的签核流程
   */
  async findByRequest(requestType, requestId) {
    return ApprovalFlow.findOne({
      where: { requestType, requestId },
      include: [{
        model: ApprovalStep,
        as: 'steps',
        order: [['level', 'ASC']],
        include: [
          { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'proxyApprover', attributes: ['id', 'name', 'email'] },
        ],
      }],
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * 获取某审批人的待审列表
   */
  async getPendingForApprover(approverId) {
    return ApprovalStep.findAll({
      where: {
        approverId,
        status: 'pending',
      },
      include: [{
        model: ApprovalFlow,
        where: { status: 'pending' },
        attributes: ['id', 'requestType', 'requestId', 'currentLevel', 'totalLevels'],
      }],
      order: [['created_at', 'ASC']],
    });
  }
}

const approvalService = new ApprovalService();
module.exports = approvalService;

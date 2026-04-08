const { User, LeaveBalance, LeaveType } = require('../models');
const { hashPassword, generateRandomPassword } = require('../utils/password');
const emailService = require('../services/email-service');
const response = require('../utils/response');
const AppError = require('../utils/app-error');
const { Op } = require('sequelize');

/**
 * GET /api/users
 * 获取用户列表（admin 看全部，manager 看下属）
 */
const getUsers = async (req, res) => {
  const { role, userId } = req.user;
  const { page = 1, limit = 20, search, status, userRole } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (role === 'manager') {
    where.approverId = userId;
  }
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (status) where.status = status;
  if (userRole) where.role = userRole;

  const { rows, count } = await User.findAndCountAll({
    where,
    include: [{ model: User, as: 'approver', attributes: ['id', 'name'] }],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
  });

  return response.paginated(res, rows, {
    total: count,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(count / limit),
  });
};

/**
 * POST /api/users
 * 新增用户（admin only）
 */
const createUser = async (req, res) => {
  const { name, email, role, approverId, department, hireDate, gender } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) throw new AppError('Email 已被使用', 400, 'EMAIL_EXISTS');

  const rawPassword = generateRandomPassword();
  const hashedPassword = await hashPassword(rawPassword);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'employee',
    approverId: approverId || null,
    department: department || null,
    hireDate: hireDate || null,
    gender: gender || null,
    mustChangePassword: true,
  });

  // NOTE: 发送欢迎邮件（异步，不阻塞响应）
  emailService.sendWelcome(email, name, rawPassword).catch((err) => {
    console.error('[createUser] 发送欢迎邮件失败:', err);
  });

  // 查询完整用户信息（排除密码字段）
  const created = await User.findByPk(user.id, {
    include: [{ model: User, as: 'approver', attributes: ['id', 'name'] }],
  });

  return response.success(res, created, '用户创建成功', 201);
};

/**
 * GET /api/users/:id
 */
const getUser = async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    include: [{ model: User, as: 'approver', attributes: ['id', 'name'] }],
  });
  if (!user) throw new AppError('用户不存在', 404);
  return response.success(res, user);
};

/**
 * PUT /api/users/:id
 * 编辑用户（admin only）
 */
const updateUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('用户不存在', 404);

  const { name, role, approverId, department, hireDate, gender } = req.body;
  await user.update({
    ...(name !== undefined && { name }),
    ...(role !== undefined && { role }),
    ...(approverId !== undefined && { approverId }),
    ...(department !== undefined && { department }),
    ...(hireDate !== undefined && { hireDate }),
    ...(gender !== undefined && { gender }),
  });

  const updated = await User.findByPk(user.id, {
    include: [{ model: User, as: 'approver', attributes: ['id', 'name'] }],
  });
  return response.success(res, updated, '用户信息已更新');
};

/**
 * PUT /api/users/:id/status
 * 停用/启用用户
 */
const updateUserStatus = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('用户不存在', 404);

  const { status } = req.body;
  await user.update({ status });
  return response.success(res, { id: user.id, status }, `用户已${status === 'active' ? '启用' : '停用'}`);
};

/**
 * DELETE /api/users/:id
 * 软删除（设为 inactive）
 */
const deleteUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('用户不存在', 404);
  await user.update({ status: 'inactive' });
  return response.success(res, null, '用户已删除');
};

/**
 * GET /api/users/me
 * 获取当前登入用户信息
 */
const getMe = async (req, res) => {
  const user = await User.findByPk(req.user.userId, {
    include: [{ model: User, as: 'approver', attributes: ['id', 'name'] }],
  });
  if (!user) throw new AppError('用户不存在', 404);
  return response.success(res, user);
};

/**
 * PUT /api/users/:id/leave-balance
 * 设定员工假额度
 */
const updateLeaveBalance = async (req, res) => {
  const { typeId, year, totalDays } = req.body;
  const userId = parseInt(req.params.id, 10);

  const user = await User.findByPk(userId);
  if (!user) throw new AppError('用户不存在', 404);

  const leaveType = await LeaveType.findByPk(typeId);
  if (!leaveType) throw new AppError('假别不存在', 404);

  const [balance] = await LeaveBalance.upsert({
    userId,
    typeId,
    year: year || new Date().getFullYear(),
    totalDays,
  });

  return response.success(res, balance, '假额度已更新');
};

/**
 * GET /api/users/available-proxies
 * 获取可选代理人列表（排除自己）
 */
const getAvailableProxies = async (req, res) => {
  const users = await User.findAll({
    where: {
      id: { [Op.ne]: req.user.userId },
      status: 'active',
    },
    attributes: ['id', 'name', 'department'],
    order: [['name', 'ASC']],
  });
  return response.success(res, users);
};

module.exports = {
  getUsers, createUser, getUser, updateUser,
  updateUserStatus, deleteUser, getMe,
  updateLeaveBalance, getAvailableProxies,
};

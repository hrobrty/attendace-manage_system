const { User } = require('../models');
const { comparePassword, hashPassword } = require('../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const response = require('../utils/response');
const AppError = require('../utils/app-error');

/**
 * POST /api/auth/login
 * 用户登入，返回 Access Token + 设置 Refresh Token cookie
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user) {
    throw new AppError('Email 或密码错误', 401, 'INVALID_CREDENTIALS');
  }

  if (user.status === 'inactive') {
    throw new AppError('账号已停用，请联系管理员', 403, 'ACCOUNT_INACTIVE');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new AppError('Email 或密码错误', 401, 'INVALID_CREDENTIALS');
  }

  const payload = { userId: user.id, role: user.role, name: user.name };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ userId: user.id });

  // NOTE: Refresh Token 存入 httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
  });

  return response.success(res, {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
  }, '登入成功');
};

/**
 * POST /api/auth/refresh
 * 使用 Refresh Token 换取新的 Access Token
 */
const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new AppError('请重新登入', 401, 'NO_REFRESH_TOKEN');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new AppError('登入已过期，请重新登入', 401, 'INVALID_REFRESH_TOKEN');
  }

  const user = await User.findByPk(decoded.userId);
  if (!user || user.status === 'inactive') {
    throw new AppError('账号不存在或已停用', 403, 'ACCOUNT_INVALID');
  }

  const payload = { userId: user.id, role: user.role, name: user.name };
  const accessToken = signAccessToken(payload);

  return response.success(res, { accessToken }, 'Token 刷新成功');
};

/**
 * POST /api/auth/logout
 * 清除 Refresh Token cookie
 */
const logout = async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return response.success(res, null, '已登出');
};

/**
 * PUT /api/auth/change-password
 * 修改密码（需提供当前密码）
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  const user = await User.scope('withPassword').findByPk(userId);
  if (!user) throw new AppError('用户不存在', 404);

  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) throw new AppError('当前密码错误', 400, 'WRONG_PASSWORD');

  const hashed = await hashPassword(newPassword);
  await user.update({ password: hashed, mustChangePassword: false });

  return response.success(res, null, '密码修改成功');
};

module.exports = { login, refresh, logout, changePassword };

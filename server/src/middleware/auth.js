const { verifyAccessToken } = require('../utils/jwt');
const AppError = require('../utils/app-error');

/**
 * 身份验证中间件
 * 从 Authorization header 提取 Bearer token 并验证
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('请先登入', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('登入已过期，请重新登入', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('无效的认证信息', 401, 'INVALID_TOKEN');
  }
};

/**
 * 角色权限检查中间件工厂
 * @param  {...string} allowedRoles 允许的角色列表
 * @returns {Function} Express 中间件
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('请先登入', 401, 'UNAUTHORIZED');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('权限不足', 403, 'FORBIDDEN');
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };

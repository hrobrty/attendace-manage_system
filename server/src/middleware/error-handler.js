const AppError = require('../utils/app-error');
const response = require('../utils/response');

/**
 * 全局错误处理中间件
 * 区分预期业务错误和非预期系统错误，避免泄露内部堆栈
 */
const errorHandler = (err, req, res, _next) => {
  // NOTE: Sequelize 验证错误转为 400
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors?.map((e) => e.message).join(', ') || '数据验证失败';
    return response.error(res, messages, 400, 'VALIDATION_ERROR');
  }

  // NOTE: express-validator 错误
  if (err.type === 'entity.parse.failed') {
    return response.error(res, '请求体格式错误', 400, 'PARSE_ERROR');
  }

  // 预期内的业务错误
  if (err.isOperational) {
    return response.error(res, err.message, err.statusCode, err.code);
  }

  // 非预期系统错误 — 记录完整堆栈但不暴露给前端
  console.error('[UnhandledError]', err);
  return response.error(res, '服务器内部错误', 500, 'INTERNAL_ERROR');
};

module.exports = errorHandler;

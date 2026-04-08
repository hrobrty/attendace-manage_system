/**
 * 自定义应用错误类
 * 用于区分预期内的业务错误和非预期的系统错误
 */
class AppError extends Error {
  /**
   * @param {string} message 错误信息
   * @param {number} statusCode HTTP 状态码
   * @param {string} [code] 业务错误码（可选）
   */
  constructor(message, statusCode, code = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

/**
 * 统一 API 响应格式工具
 * 确保所有 API 返回一致的 JSON 结构
 */

/**
 * 成功响应
 * @param {import('express').Response} res
 * @param {*} data 响应数据
 * @param {string} [message] 成功信息
 * @param {number} [statusCode] HTTP 状态码，默认 200
 */
const success = (res, data = null, message = '操作成功', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * 分页响应
 * @param {import('express').Response} res
 * @param {*} data 列表数据
 * @param {object} pagination 分页信息
 * @param {string} [message] 成功信息
 */
const paginated = (res, data, pagination, message = '查询成功') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

/**
 * 错误响应
 * @param {import('express').Response} res
 * @param {string} message 错误信息
 * @param {number} [statusCode] HTTP 状态码，默认 500
 * @param {string} [code] 业务错误码
 */
const error = (res, message = '服务器内部错误', statusCode = 500, code = 'ERROR') => {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
  });
};

module.exports = { success, paginated, error };

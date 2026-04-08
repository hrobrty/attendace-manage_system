const { validationResult } = require('express-validator');
const response = require('../utils/response');

/**
 * express-validator 验证结果检查中间件
 * 放在路由验证规则之后，自动检查并返回第一个错误
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return response.error(res, firstError.msg, 400, 'VALIDATION_ERROR');
  }
  next();
};

module.exports = validate;

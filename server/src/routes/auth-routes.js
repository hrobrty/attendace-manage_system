const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth');
const { login, refresh, logout, changePassword } = require('../controllers/auth-controller');

const router = Router();

// NOTE: 需要 cookie-parser 中间件解析 refresh token
router.post('/login', [
  body('email').isEmail().withMessage('请输入有效的 Email'),
  body('password').notEmpty().withMessage('请输入密码'),
  validate,
], login);

router.post('/refresh', refresh);
router.post('/logout', logout);

router.put('/change-password', verifyToken, [
  body('currentPassword').notEmpty().withMessage('请输入当前密码'),
  body('newPassword').isLength({ min: 8 }).withMessage('新密码至少 8 个字符'),
  validate,
], changePassword);

module.exports = router;

const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getUsers, createUser, getUser, updateUser,
  updateUserStatus, deleteUser, getMe,
  updateLeaveBalance, getAvailableProxies,
} = require('../controllers/user-controller');

const router = Router();

// 所有路由均需认证
router.use(verifyToken);

// 当前用户相关（放在 /:id 前面避免路由冲突）
router.get('/me', getMe);
router.get('/available-proxies', getAvailableProxies);

// 用户 CRUD（admin only）
router.get('/', requireRole('admin', 'manager'), getUsers);

router.post('/', requireRole('admin'), [
  body('name').notEmpty().withMessage('请输入姓名'),
  body('email').isEmail().withMessage('请输入有效的 Email'),
  body('role').optional().isIn(['admin', 'manager', 'employee']).withMessage('无效的角色'),
  validate,
], createUser);

router.get('/:id', requireRole('admin', 'manager'), getUser);

router.put('/:id', requireRole('admin'), [
  body('name').optional().notEmpty().withMessage('姓名不能为空'),
  body('role').optional().isIn(['admin', 'manager', 'employee']),
  validate,
], updateUser);

router.put('/:id/status', requireRole('admin'), [
  body('status').isIn(['active', 'inactive']).withMessage('无效的状态'),
  validate,
], updateUserStatus);

router.delete('/:id', requireRole('admin'), deleteUser);

router.put('/:id/leave-balance', requireRole('admin'), [
  body('typeId').isInt().withMessage('请选择假别'),
  body('totalDays').isFloat({ min: 0 }).withMessage('额度必须大于等于 0'),
  validate,
], updateLeaveBalance);

module.exports = router;

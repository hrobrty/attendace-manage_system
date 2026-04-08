const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getSettings, getPublicSettings, updateSettings,
  getLeaveTypes, createLeaveType, updateLeaveType, toggleLeaveTypeStatus,
} = require('../controllers/settings-controller');

const router = Router();

router.use(verifyToken);

// 公开设置
router.get('/public', getPublicSettings);

// Admin only
router.get('/', requireRole('admin'), getSettings);
router.put('/', requireRole('admin'), [
  body('updates').isArray({ min: 1 }).withMessage('请提供要更新的设置'),
  validate,
], updateSettings);

// 假别管理
router.get('/leave-types', getLeaveTypes);
router.post('/leave-types', requireRole('admin'), [
  body('name').notEmpty().withMessage('请输入假别名称'),
  body('code').notEmpty().withMessage('请输入假别代码'),
  validate,
], createLeaveType);
router.put('/leave-types/:id', requireRole('admin'), updateLeaveType);
router.put('/leave-types/:id/status', requireRole('admin'), toggleLeaveTypeStatus);

module.exports = router;

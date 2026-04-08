const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth');
const { createOvertimeRequest, getOvertimeRequests, getMonthlySummary } = require('../controllers/overtime-controller');

const router = Router();

router.use(verifyToken);

router.post('/', [
  body('date').isDate().withMessage('请选择日期'),
  body('startTime').notEmpty().withMessage('请选择开始时间'),
  body('endTime').notEmpty().withMessage('请选择结束时间'),
  body('hours').isFloat({ min: 0.5 }).withMessage('加班时数不能小于 0.5 小时'),
  validate,
], createOvertimeRequest);

router.get('/', getOvertimeRequests);
router.get('/summary', getMonthlySummary);

module.exports = router;

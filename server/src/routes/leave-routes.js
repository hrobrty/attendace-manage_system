const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth');
const {
  createLeaveRequest, getLeaveRequests, getLeaveRequest,
  cancelLeaveRequest, getLeaveBalances,
} = require('../controllers/leave-controller');

const router = Router();

router.use(verifyToken);

router.post('/', [
  body('typeId').isInt().withMessage('请选择假别'),
  body('startDate').isDate().withMessage('请选择起始日期'),
  body('endDate').isDate().withMessage('请选择结束日期'),
  body('totalDays').isFloat({ min: 0.5 }).withMessage('请假天数不能小于 0.5 天'),
  validate,
], createLeaveRequest);

router.get('/', getLeaveRequests);
router.get('/balances', getLeaveBalances);
router.get('/:id', getLeaveRequest);
router.put('/:id/cancel', cancelLeaveRequest);

module.exports = router;

const { Router } = require('express');
const { verifyToken } = require('../middleware/auth');
const { clockIn, clockOut, getToday, getRecords } = require('../controllers/attendance-controller');
const { createAmendment, getMyAmendments } = require('../controllers/amendment-controller');

const router = Router();

router.use(verifyToken);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/today', getToday);
router.get('/', getRecords);

// 补打卡
router.post('/amendments', createAmendment);
router.get('/amendments/my', getMyAmendments);

module.exports = router;

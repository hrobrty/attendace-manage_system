const { Router } = require('express');
const { verifyToken } = require('../middleware/auth');
const { clockIn, clockOut, getToday, getRecords } = require('../controllers/attendance-controller');

const router = Router();

router.use(verifyToken);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/today', getToday);
router.get('/', getRecords);

module.exports = router;

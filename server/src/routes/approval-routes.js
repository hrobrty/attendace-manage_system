const { Router } = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { getPending, approve, reject } = require('../controllers/approval-controller');

const router = Router();

router.use(verifyToken);

router.get('/pending', requireRole('admin', 'manager'), getPending);
router.put('/:flowId/approve', requireRole('admin', 'manager'), approve);
router.put('/:flowId/reject', requireRole('admin', 'manager'), reject);

module.exports = router;

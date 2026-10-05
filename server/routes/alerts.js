const express = require('express');
const router = express.Router();
const { getAlerts, markRead, markAllRead, deleteAlert } = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getAlerts);
router.put('/mark-all-read', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', deleteAlert);

module.exports = router;

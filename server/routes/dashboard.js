const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getAdminDashboard,
  getProductionDashboard,
  getInventoryDashboard,
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getDashboard);
router.get('/admin', authorize('Admin'), getAdminDashboard);
router.get('/production', authorize('Admin', 'Production Manager'), getProductionDashboard);
router.get('/inventory', authorize('Admin', 'Inventory Manager'), getInventoryDashboard);

module.exports = router;

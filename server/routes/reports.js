const express = require('express');
const router = express.Router();
const { getProductionReport, getInventoryReport, getDemandReport, getSummaryReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/summary', getSummaryReport);
router.get('/production', getProductionReport);
router.get('/inventory', getInventoryReport);
router.get('/demands', getDemandReport);

module.exports = router;

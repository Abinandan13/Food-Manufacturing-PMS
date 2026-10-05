const express = require('express');
const router = express.Router();
const { getBOMs, getBOM, createBOM, updateBOM, deleteBOM, getMaterialRequirements } = require('../controllers/bomController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Material requirements can be viewed by Production & Inventory managers and Admin
router.get('/product/:productId/requirements', getMaterialRequirements);

router.route('/')
  .get(getBOMs)
  .post(authorize('Admin', 'Inventory Manager'), createBOM);

router.route('/:id')
  .get(getBOM)
  .put(authorize('Admin', 'Inventory Manager'), updateBOM)
  .delete(authorize('Admin', 'Inventory Manager'), deleteBOM);

module.exports = router;

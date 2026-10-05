const express = require('express');
const router = express.Router();
const { getInventory, getInventoryById, createInventoryTransaction } = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(authorize('Admin', 'Inventory Manager'), getInventory)
  .post(authorize('Admin', 'Inventory Manager'), createInventoryTransaction);

router.route('/:id')
  .get(authorize('Admin', 'Inventory Manager'), getInventoryById);

module.exports = router;

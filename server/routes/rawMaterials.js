const express = require('express');
const router = express.Router();
const { getRawMaterials, getRawMaterial, createRawMaterial, updateRawMaterial, deleteRawMaterial } = require('../controllers/rawMaterialController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getRawMaterials)
  .post(authorize('Admin', 'Inventory Manager'), createRawMaterial);

router.route('/:id')
  .get(getRawMaterial)
  .put(authorize('Admin', 'Inventory Manager'), updateRawMaterial)
  .delete(authorize('Admin', 'Inventory Manager'), deleteRawMaterial);

module.exports = router;

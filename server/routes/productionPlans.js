const express = require('express');
const router = express.Router();
const { getProductionPlans, getProductionPlan, createProductionPlan, updateProductionPlan, deleteProductionPlan } = require('../controllers/productionPlanController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(authorize('Admin', 'Production Manager'), getProductionPlans)
  .post(authorize('Admin', 'Production Manager'), createProductionPlan);

router.route('/:id')
  .get(authorize('Admin', 'Production Manager'), getProductionPlan)
  .put(authorize('Admin', 'Production Manager'), updateProductionPlan)
  .delete(authorize('Admin', 'Production Manager'), deleteProductionPlan);

module.exports = router;

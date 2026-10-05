const express = require('express');
const router = express.Router();
const { getDemands, getDemand, createDemand, updateDemand, deleteDemand } = require('../controllers/demandController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(authorize('Admin', 'Production Manager'), getDemands)
  .post(authorize('Admin', 'Production Manager'), createDemand);

router.route('/:id')
  .get(authorize('Admin', 'Production Manager'), getDemand)
  .put(authorize('Admin', 'Production Manager'), updateDemand)
  .delete(authorize('Admin', 'Production Manager'), deleteDemand);

module.exports = router;

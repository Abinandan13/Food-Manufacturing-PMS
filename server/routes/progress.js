const express = require('express');
const router = express.Router();
const { getProgress, getProgressById, createProgress, updateProgress } = require('../controllers/progressController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(authorize('Admin', 'Production Manager'), getProgress)
  .post(authorize('Admin', 'Production Manager'), createProgress);

router.route('/:id')
  .get(authorize('Admin', 'Production Manager'), getProgressById)
  .put(authorize('Admin', 'Production Manager'), updateProgress);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getProducts)
  .post(authorize('Admin', 'Production Manager'), createProduct);

router.route('/:id')
  .get(getProduct)
  .put(authorize('Admin', 'Production Manager'), updateProduct)
  .delete(authorize('Admin', 'Production Manager'), deleteProduct);

module.exports = router;

const Product = require('../models/Product');
const { getNextId } = require('../utils/generateId');

// @desc   Get all products
// @route  GET /api/products
exports.getProducts = async (req, res, next) => {
  try {
    const { search, status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) filter.$or = [
      { productName: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ];
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (error) { next(error); }
};

// @desc   Get single product
// @route  GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

// @desc   Create product
// @route  POST /api/products
exports.createProduct = async (req, res, next) => {
  try {
    const productId = await getNextId(Product, 'productId', 'PROD');
    const product = await Product.create({ ...req.body, productId });
    res.status(201).json({ success: true, data: product });
  } catch (error) { next(error); }
};

// @desc   Update product
// @route  PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

// @desc   Delete product
// @route  DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) { next(error); }
};

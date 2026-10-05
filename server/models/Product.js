const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productId: { type: String, unique: true, required: true },
    productName: { type: String, required: [true, 'Product name is required'], trim: true },
    category: { type: String, trim: true },
    description: { type: String, trim: true },
    unit: { type: String, default: 'units' },
    price: { type: Number, min: 0, default: 0 },
    productionTime: { type: Number, min: 0, default: 1, comment: 'In hours' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

productSchema.index({ productName: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);

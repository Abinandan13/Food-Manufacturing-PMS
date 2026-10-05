const mongoose = require('mongoose');

const bomSchema = new mongoose.Schema(
  {
    bomId: { type: String, unique: true, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
    quantityPerUnit: {
      type: Number,
      required: [true, 'Quantity per unit is required'],
      min: [0.0001, 'Quantity per unit must be positive'],
    },
    unit: { type: String, default: 'kg' },
  },
  { timestamps: true }
);

// One material per product in BOM
bomSchema.index({ productId: 1, materialId: 1 }, { unique: true });

module.exports = mongoose.model('BOM', bomSchema);

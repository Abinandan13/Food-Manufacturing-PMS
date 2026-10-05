const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema(
  {
    materialId: { type: String, unique: true, required: true },
    materialName: { type: String, required: [true, 'Material name is required'], trim: true },
    category: { type: String, trim: true },
    unit: { type: String, default: 'kg' },
    currentStock: { type: Number, default: 0, min: 0 },
    minimumStock: { type: Number, default: 0 },
    maximumStock: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 0 },
    supplier: { type: String, trim: true },
    unitCost: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['Available', 'Low Stock', 'Out of Stock'],
      default: 'Available',
    },
  },
  { timestamps: true }
);

// Auto-update status based on currentStock
rawMaterialSchema.pre('save', function (next) {
  if (this.currentStock === 0) {
    this.status = 'Out of Stock';
  } else if (this.currentStock <= this.reorderLevel) {
    this.status = 'Low Stock';
  } else {
    this.status = 'Available';
  }
  next();
});

rawMaterialSchema.index({ materialName: 'text', category: 'text' });

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);

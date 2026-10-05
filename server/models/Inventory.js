const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  inventoryId: { type: String, unique: true, required: true },
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
  transactionType: {
    type: String,
    enum: ['IN', 'OUT', 'ADJUSTMENT'],
    required: [true, 'Transaction type is required'],
  },
  quantity: { type: Number, required: [true, 'Quantity is required'], min: [0.001, 'Quantity must be positive'] },
  reference: { type: String, trim: true },
  transactionDate: { type: Date, default: Date.now },
  remarks: { type: String, trim: true },
});

module.exports = mongoose.model('Inventory', inventorySchema);

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  alertId: { type: String, unique: true, required: true },
  type: {
    type: String,
    enum: ['LOW_STOCK', 'MATERIAL_SHORTAGE', 'PRODUCTION_DELAY', 'PENDING_DEMAND', 'PRODUCTION_COMPLETED'],
    required: true,
  },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  relatedId: { type: String },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Alert', alertSchema);

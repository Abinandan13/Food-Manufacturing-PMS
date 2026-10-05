const mongoose = require('mongoose');

const demandSchema = new mongoose.Schema(
  {
    demandId: { type: String, unique: true, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    customerName: { type: String, required: [true, 'Customer name is required'], trim: true },
    quantity: { type: Number, required: [true, 'Quantity is required'], min: [1, 'Quantity must be at least 1'] },
    demandDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: [true, 'Due date is required'] },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'In Production', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Demand', demandSchema);

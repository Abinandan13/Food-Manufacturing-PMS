const mongoose = require('mongoose');

const productionPlanSchema = new mongoose.Schema(
  {
    planId: { type: String, unique: true, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    demandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Demand' },
    plannedQuantity: {
      type: Number,
      required: [true, 'Planned quantity is required'],
      min: [0, 'Planned quantity cannot be negative'],
    },
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: { type: Date, required: [true, 'End date is required'] },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Planned', 'Scheduled', 'In Progress', 'Completed', 'Delayed', 'Cancelled'],
      default: 'Planned',
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductionPlan', productionPlanSchema);

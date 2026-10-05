const mongoose = require('mongoose');

const manufacturingProgressSchema = new mongoose.Schema(
  {
    progressId: { type: String, unique: true, required: true },
    productionPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionPlan', required: true },
    plannedQuantity: { type: Number, required: true, min: 0 },
    completedQuantity: { type: Number, default: 0, min: 0 },
    rejectedQuantity: { type: Number, default: 0, min: 0 },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Delayed'],
      default: 'Not Started',
    },
    startTime: { type: Date },
    endTime: { type: Date },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

// Auto-calculate progressPercentage before save
manufacturingProgressSchema.pre('save', function (next) {
  if (this.plannedQuantity > 0) {
    this.progressPercentage = Math.min(
      100,
      Math.round((this.completedQuantity / this.plannedQuantity) * 100)
    );
  }
  next();
});

module.exports = mongoose.model('ManufacturingProgress', manufacturingProgressSchema);

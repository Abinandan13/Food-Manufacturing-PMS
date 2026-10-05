const ProductionPlan = require('../models/ProductionPlan');
const { getNextId } = require('../utils/generateId');
const { createAlert } = require('../utils/alertService');

exports.getProductionPlans = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    const plans = await ProductionPlan.find(filter)
      .populate('productId', 'productName productId unit')
      .populate('demandId', 'demandId customerName quantity')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: plans.length, data: plans });
  } catch (error) { next(error); }
};

exports.getProductionPlan = async (req, res, next) => {
  try {
    const plan = await ProductionPlan.findById(req.params.id)
      .populate('productId').populate('demandId');
    if (!plan) return res.status(404).json({ success: false, message: 'Production plan not found' });
    res.json({ success: true, data: plan });
  } catch (error) { next(error); }
};

exports.createProductionPlan = async (req, res, next) => {
  try {
    let { plannedQuantity, demandId, availableStock } = req.body;
    
    // Business logic: production quantity = demand quantity - available finished stock
    if (demandId && (plannedQuantity === undefined || plannedQuantity === null || plannedQuantity === '')) {
      const Demand = require('../models/Demand');
      const demand = await Demand.findById(demandId);
      if (demand) {
        const stock = Number(availableStock) || 0;
        plannedQuantity = Math.max(0, demand.quantity - stock);
      }
    }

    plannedQuantity = Number(plannedQuantity);
    if (isNaN(plannedQuantity) || plannedQuantity < 0) {
      return res.status(400).json({ success: false, message: 'Planned quantity cannot be negative' });
    }

    const planId = await getNextId(ProductionPlan, 'planId', 'PLAN');
    const plan = await ProductionPlan.create({ ...req.body, plannedQuantity, planId });
    const populated = await plan.populate('productId', 'productName');
    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

exports.updateProductionPlan = async (req, res, next) => {
  try {
    const plan = await ProductionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('productId', 'productName productId unit')
      .populate('demandId', 'demandId customerName');

    if (!plan) return res.status(404).json({ success: false, message: 'Production plan not found' });

    if (plan.status === 'Delayed') {
      await createAlert({
        type: 'PRODUCTION_DELAY',
        title: `Production Delayed: ${plan.productId?.productName}`,
        message: `Production plan ${plan.planId} has been marked as Delayed.`,
        severity: 'High',
        relatedId: plan.planId,
      });
    }
    if (plan.status === 'Completed') {
      await createAlert({
        type: 'PRODUCTION_COMPLETED',
        title: `Production Completed: ${plan.productId?.productName}`,
        message: `Production plan ${plan.planId} has been completed successfully.`,
        severity: 'Low',
        relatedId: plan.planId,
      });
    }

    res.json({ success: true, data: plan });
  } catch (error) { next(error); }
};

exports.deleteProductionPlan = async (req, res, next) => {
  try {
    const plan = await ProductionPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Production plan not found' });
    res.json({ success: true, message: 'Production plan deleted successfully' });
  } catch (error) { next(error); }
};

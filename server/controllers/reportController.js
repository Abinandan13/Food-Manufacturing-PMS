const Product = require('../models/Product');
const Demand = require('../models/Demand');
const ProductionPlan = require('../models/ProductionPlan');
const RawMaterial = require('../models/RawMaterial');
const Inventory = require('../models/Inventory');
const ManufacturingProgress = require('../models/ManufacturingProgress');

// @desc   Production report
// @route  GET /api/reports/production
exports.getProductionReport = async (req, res, next) => {
  try {
    const plans = await ProductionPlan.find().populate('productId', 'productName productId');
    const byStatus = {
      Planned: plans.filter((p) => p.status === 'Planned').length,
      Scheduled: plans.filter((p) => p.status === 'Scheduled').length,
      'In Progress': plans.filter((p) => p.status === 'In Progress').length,
      Completed: plans.filter((p) => p.status === 'Completed').length,
      Delayed: plans.filter((p) => p.status === 'Delayed').length,
      Cancelled: plans.filter((p) => p.status === 'Cancelled').length,
    };
    const totalPlanned = plans.reduce((sum, p) => sum + p.plannedQuantity, 0);
    const progress = await ManufacturingProgress.find();
    const totalCompleted = progress.reduce((sum, p) => sum + p.completedQuantity, 0);
    res.json({ success: true, data: { byStatus, totalPlans: plans.length, totalPlanned, totalCompleted, completionRate: totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0, plans } });
  } catch (error) { next(error); }
};

// @desc   Inventory report
// @route  GET /api/reports/inventory
exports.getInventoryReport = async (req, res, next) => {
  try {
    const materials = await RawMaterial.find();
    const byStatus = {
      Available: materials.filter((m) => m.status === 'Available').length,
      'Low Stock': materials.filter((m) => m.status === 'Low Stock').length,
      'Out of Stock': materials.filter((m) => m.status === 'Out of Stock').length,
    };
    const totalValue = materials.reduce((sum, m) => sum + m.currentStock * m.unitCost, 0);
    const transactions = await Inventory.find().populate('materialId', 'materialName unit');
    res.json({ success: true, data: { materials, byStatus, totalMaterials: materials.length, totalValue: Math.round(totalValue * 100) / 100, transactions } });
  } catch (error) { next(error); }
};

// @desc   Demand report
// @route  GET /api/reports/demands
exports.getDemandReport = async (req, res, next) => {
  try {
    const demands = await Demand.find().populate('productId', 'productName productId');
    const byStatus = {
      Pending: demands.filter((d) => d.status === 'Pending').length,
      Approved: demands.filter((d) => d.status === 'Approved').length,
      'In Production': demands.filter((d) => d.status === 'In Production').length,
      Completed: demands.filter((d) => d.status === 'Completed').length,
      Cancelled: demands.filter((d) => d.status === 'Cancelled').length,
    };
    const byPriority = {
      Low: demands.filter((d) => d.priority === 'Low').length,
      Medium: demands.filter((d) => d.priority === 'Medium').length,
      High: demands.filter((d) => d.priority === 'High').length,
      Urgent: demands.filter((d) => d.priority === 'Urgent').length,
    };
    res.json({ success: true, data: { demands, byStatus, byPriority, totalDemands: demands.length, totalQuantity: demands.reduce((sum, d) => sum + d.quantity, 0) } });
  } catch (error) { next(error); }
};

// @desc   Summary report
// @route  GET /api/reports/summary
exports.getSummaryReport = async (req, res, next) => {
  try {
    const [products, demands, plans, materials, progress] = await Promise.all([
      Product.countDocuments(),
      Demand.countDocuments(),
      ProductionPlan.countDocuments(),
      RawMaterial.countDocuments(),
      ManufacturingProgress.find(),
    ]);
    const completionRates = progress.map((p) => p.progressPercentage);
    const avgCompletion = completionRates.length ? Math.round(completionRates.reduce((a, b) => a + b, 0) / completionRates.length) : 0;
    res.json({ success: true, data: { products, demands, productionPlans: plans, rawMaterials: materials, avgCompletionRate: avgCompletion } });
  } catch (error) { next(error); }
};

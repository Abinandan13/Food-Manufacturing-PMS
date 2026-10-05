const Product = require('../models/Product');
const Demand = require('../models/Demand');
const ProductionPlan = require('../models/ProductionPlan');
const RawMaterial = require('../models/RawMaterial');
const Alert = require('../models/Alert');
const ManufacturingProgress = require('../models/ManufacturingProgress');
const Inventory = require('../models/Inventory');

// @desc   Get Admin Dashboard data (Full overview)
// @route  GET /api/dashboard or GET /api/dashboard/admin
exports.getAdminDashboard = async (req, res, next) => {
  try {
    const [
      totalProducts,
      totalDemands,
      pendingDemands,
      activePlans,
      totalMaterials,
      lowStockMaterials,
      pendingAlerts,
      recentAlerts,
      progressRecords,
      recentProduction,
      demandList,
      materialList,
    ] = await Promise.all([
      Product.countDocuments({ status: 'Active' }),
      Demand.countDocuments(),
      Demand.countDocuments({ status: 'Pending' }),
      ProductionPlan.countDocuments({ status: { $in: ['Planned', 'Scheduled', 'In Progress'] } }),
      RawMaterial.countDocuments(),
      RawMaterial.countDocuments({
        $or: [{ status: { $in: ['Low Stock', 'Out of Stock'] } }, { $expr: { $lte: ['$currentStock', '$reorderLevel'] } }],
      }),
      Alert.countDocuments({ isRead: false }),
      Alert.find().sort({ createdAt: -1 }).limit(6),
      ManufacturingProgress.find()
        .populate({
          path: 'productionPlanId',
          populate: { path: 'productId', select: 'productName productId unit' },
        })
        .sort({ updatedAt: -1 })
        .limit(6),
      ProductionPlan.find().populate('productId', 'productName productId unit').sort({ createdAt: -1 }).limit(6),
      Demand.find().populate('productId', 'productName productId unit').sort({ createdAt: -1 }).limit(6),
      RawMaterial.find({
        $or: [{ status: { $in: ['Low Stock', 'Out of Stock'] } }, { $expr: { $lte: ['$currentStock', '$reorderLevel'] } }],
      }).limit(6),
    ]);

    // Overall production completion rate
    const totalPlannedAll = await ProductionPlan.aggregate([
      { $group: { _id: null, total: { $sum: '$plannedQuantity' } } },
    ]);
    const totalCompletedAll = await ManufacturingProgress.aggregate([
      { $group: { _id: null, total: { $sum: '$completedQuantity' } } },
    ]);
    const plannedSum = totalPlannedAll[0]?.total || 0;
    const completedSum = totalCompletedAll[0]?.total || 0;
    const avgCompletion = plannedSum > 0 ? Math.min(100, Math.round((completedSum / plannedSum) * 100)) : 0;

    // Chart 1: Demand vs Production (top products)
    const products = await Product.find().limit(6);
    const demandVsProduction = await Promise.all(
      products.map(async (product) => {
        const totalDemand = await Demand.aggregate([
          { $match: { productId: product._id } },
          { $group: { _id: null, total: { $sum: '$quantity' } } },
        ]);
        const totalProduced = await ProductionPlan.aggregate([
          { $match: { productId: product._id } },
          { $group: { _id: null, total: { $sum: '$plannedQuantity' } } },
        ]);
        return {
          name: product.productName.length > 15 ? product.productName.substring(0, 14) + '…' : product.productName,
          fullName: product.productName,
          demand: totalDemand[0]?.total || 0,
          production: totalProduced[0]?.total || 0,
        };
      })
    );

    // Chart 2: Inventory status chart data
    const available = await RawMaterial.countDocuments({
      status: 'Available',
      $expr: { $gt: ['$currentStock', '$reorderLevel'] },
    });
    const lowStock = await RawMaterial.countDocuments({
      $or: [{ status: 'Low Stock' }, { $and: [{ $expr: { $lte: ['$currentStock', '$reorderLevel'] } }, { currentStock: { $gt: 0 } }] }],
    });
    const outOfStock = await RawMaterial.countDocuments({
      $or: [{ status: 'Out of Stock' }, { currentStock: { $lte: 0 } }],
    });
    const inventoryStatus = [
      { name: 'Available', value: available, color: '#16a34a' },
      { name: 'Low Stock', value: lowStock, color: '#d97706' },
      { name: 'Out of Stock', value: outOfStock, color: '#dc2626' },
    ];

    // Chart 3: Production overview by status
    const rawProdOverview = await ProductionPlan.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, quantity: { $sum: '$plannedQuantity' } } },
    ]);
    const statusColors = {
      Planned: '#6366f1',
      Scheduled: '#3b82f6',
      'In Progress': '#d97706',
      Completed: '#16a34a',
      Delayed: '#dc2626',
      Cancelled: '#94a3af',
    };
    const productionOverview = rawProdOverview.map((p) => ({
      name: p._id,
      count: p.count,
      quantity: p.quantity,
      color: statusColors[p._id] || '#64748b',
    }));

    // Chart 4: Production Progress
    const productionProgress = progressRecords.map((p) => ({
      name: p.productionPlanId?.productId?.productName
        ? (p.productionPlanId.productId.productName.length > 12 ? p.productionPlanId.productId.productName.substring(0, 11) + '…' : p.productionPlanId.productId.productName)
        : p.progressId,
      fullName: p.productionPlanId?.productId?.productName || p.progressId,
      progressId: p.progressId,
      progress: p.progressPercentage || 0,
      completed: p.completedQuantity || 0,
      planned: p.plannedQuantity || 0,
      status: p.status,
    }));

    const responsePayload = {
      role: 'Admin',
      stats: {
        totalProducts,
        totalDemands,
        pendingDemands,
        activePlans,
        totalMaterials,
        lowStockMaterials,
        productionCompletion: avgCompletion,
        pendingAlerts,
      },
      production: recentProduction,
      inventory: materialList,
      demands: demandList,
      alerts: recentAlerts,
      charts: {
        demandVsProduction,
        productionOverview,
        inventoryStatus,
        productionProgress,
      },
    };

    res.json({
      success: true,
      ...responsePayload,
      data: {
        ...responsePayload,
        recent: {
          alerts: recentAlerts,
          production: recentProduction,
          demands: demandList,
          lowStockMaterials: materialList,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Aliased for backward compatibility with /api/dashboard
exports.getDashboard = exports.getAdminDashboard;

// @desc   Get Production Manager Dashboard data
// @route  GET /api/dashboard/production
exports.getProductionDashboard = async (req, res, next) => {
  try {
    const [
      pendingDemandsCount,
      activePlansCount,
      delayedPlansCount,
      todayUpcomingPlans,
      pendingDemandsList,
      progressRecords,
      allPlans,
      rawProdOverview,
      prodAlerts,
      productsList,
      activeDemands,
    ] = await Promise.all([
      Demand.countDocuments({ status: 'Pending' }),
      ProductionPlan.countDocuments({ status: { $in: ['Planned', 'Scheduled', 'In Progress'] } }),
      ProductionPlan.countDocuments({ status: 'Delayed' }),
      ProductionPlan.find({ status: { $in: ['Planned', 'Scheduled', 'In Progress', 'Completed'] } })
        .populate('productId', 'productName productId unit price')
        .populate('demandId', 'demandId customerName quantity priority')
        .sort({ startDate: 1, createdAt: -1 })
        .limit(8),
      Demand.find({ status: { $in: ['Pending', 'Approved'] } })
        .populate('productId', 'productName productId unit price')
        .sort({ priority: -1, createdAt: -1 })
        .limit(8),
      ManufacturingProgress.find()
        .populate({
          path: 'productionPlanId',
          populate: { path: 'productId', select: 'productName productId unit' },
        })
        .sort({ updatedAt: -1 })
        .limit(8),
      ProductionPlan.find().populate('productId', 'productName productId unit'),
      ProductionPlan.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, quantity: { $sum: '$plannedQuantity' } } },
      ]),
      Alert.find({
        type: { $in: ['PRODUCTION_DELAY', 'PRODUCTION_COMPLETED', 'PENDING_DEMAND', 'SYSTEM'] },
      })
        .sort({ createdAt: -1 })
        .limit(6),
      Product.find({ status: 'Active' }),
      Demand.find({ status: { $in: ['Pending', 'Approved', 'In Production'] } }),
    ]);

    // Calculations for Planned vs Completed
    const plannedQuantity = allPlans.reduce((sum, p) => sum + (p.plannedQuantity || 0), 0);
    const progressList = await ManufacturingProgress.find();
    const completedQuantity = progressList.reduce((sum, p) => sum + (p.completedQuantity || 0), 0);
    const delayedProgressCount = progressList.filter((p) => p.status === 'Delayed').length;
    const delayedOrIncomplete = delayedPlansCount + delayedProgressCount;

    const productionProgressPct = plannedQuantity > 0 ? Math.min(100, Math.round((completedQuantity / plannedQuantity) * 100)) : 0;

    // Chart: Planned vs Completed by Product
    const plannedVsCompleted = await Promise.all(
      productsList.slice(0, 6).map(async (prod) => {
        const prodPlans = await ProductionPlan.find({ productId: prod._id });
        const prodPlanIds = prodPlans.map((p) => p._id);
        const prodPlanned = prodPlans.reduce((sum, p) => sum + (p.plannedQuantity || 0), 0);
        const prodProgress = await ManufacturingProgress.find({ productionPlanId: { $in: prodPlanIds } });
        const prodCompleted = prodProgress.reduce((sum, p) => sum + (p.completedQuantity || 0), 0);

        return {
          name: prod.productName.length > 14 ? prod.productName.substring(0, 13) + '…' : prod.productName,
          fullName: prod.productName,
          planned: prodPlanned,
          completed: prodCompleted,
          unit: prod.unit,
        };
      })
    );

    // Chart: Production Status Overview
    const statusColors = {
      Planned: '#6366f1',
      Scheduled: '#3b82f6',
      'In Progress': '#d97706',
      Completed: '#16a34a',
      Delayed: '#dc2626',
      Cancelled: '#94a3af',
    };
    const productionStatus = rawProdOverview.map((p) => ({
      name: p._id,
      count: p.count,
      quantity: p.quantity,
      color: statusColors[p._id] || '#64748b',
    }));

    // Products Requiring Production (Business Rule: suggestedProduction = max(0, demand - availableFinishedStock))
    const productsRequiringProduction = await Promise.all(
      productsList.map(async (prod) => {
        const productDemands = activeDemands.filter((d) => String(d.productId) === String(prod._id));
        const totalDemand = productDemands.reduce((sum, d) => sum + (d.quantity || 0), 0);

        // Completed finished stock produced
        const prodPlans = await ProductionPlan.find({ productId: prod._id, status: 'Completed' });
        const prodPlanIds = prodPlans.map((p) => p._id);
        const finishedProgress = await ManufacturingProgress.find({ productionPlanId: { $in: prodPlanIds }, status: 'Completed' });
        const availableFinishedStock = finishedProgress.reduce((sum, p) => sum + (p.completedQuantity || 0), 0);

        // Suggested production = max(0, demand - availableStock)
        const suggestedProduction = Math.max(0, totalDemand - availableFinishedStock);

        return {
          productId: prod._id,
          productCode: prod.productId,
          productName: prod.productName,
          category: prod.category,
          unit: prod.unit,
          totalDemand,
          availableFinishedStock,
          suggestedProduction,
          activeOrders: productDemands.length,
          status: suggestedProduction > 0 ? 'Production Required' : 'Stock Optimal',
        };
      })
    );

    // Filter to only items with demand or suggested production first
    const sortedProductsRequiringProduction = productsRequiringProduction
      .sort((a, b) => b.suggestedProduction - a.suggestedProduction)
      .slice(0, 6);

    const payload = {
      role: 'Production Manager',
      stats: {
        pendingDemands: pendingDemandsCount,
        activePlans: activePlansCount,
        plannedQuantity,
        completedQuantity,
        productionProgress: productionProgressPct,
        delayedOrIncomplete,
      },
      upcomingPlans: todayUpcomingPlans,
      pendingDemands: pendingDemandsList,
      progressRecords,
      productsRequiringProduction: sortedProductsRequiringProduction,
      alerts: prodAlerts,
      charts: {
        plannedVsCompleted,
        productionStatus,
        productionProgress: progressRecords.map((p) => ({
          name: p.productionPlanId?.productId?.productName
            ? (p.productionPlanId.productId.productName.length > 12 ? p.productionPlanId.productId.productName.substring(0, 11) + '…' : p.productionPlanId.productId.productName)
            : p.progressId,
          fullName: p.productionPlanId?.productId?.productName || p.progressId,
          progressId: p.progressId,
          progress: p.progressPercentage || 0,
          completed: p.completedQuantity || 0,
          planned: p.plannedQuantity || 0,
          status: p.status,
        })),
      },
    };

    res.json({
      success: true,
      data: payload,
      ...payload,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Get Inventory Manager Dashboard data
// @route  GET /api/dashboard/inventory
exports.getInventoryDashboard = async (req, res, next) => {
  try {
    const [
      totalMaterials,
      rawMaterialsList,
      inventoryTransactions,
      inventoryAlerts,
    ] = await Promise.all([
      RawMaterial.countDocuments(),
      RawMaterial.find().sort({ currentStock: 1, createdAt: -1 }),
      Inventory.find()
        .populate('materialId', 'materialName materialId unit currentStock')
        .sort({ transactionDate: -1, createdAt: -1 })
        .limit(10),
      Alert.find({
        type: { $in: ['LOW_STOCK', 'OUT_OF_STOCK', 'SYSTEM'] },
      })
        .sort({ createdAt: -1 })
        .limit(6),
    ]);

    // Low stock and out of stock
    const lowStockMaterialsList = rawMaterialsList.filter(
      (m) => (m.status === 'Low Stock' || m.currentStock <= m.reorderLevel) && m.currentStock > 0
    );
    const outOfStockMaterialsList = rawMaterialsList.filter(
      (m) => m.status === 'Out of Stock' || m.currentStock <= 0
    );

    const lowStockMaterialsCount = lowStockMaterialsList.length;
    const outOfStockMaterialsCount = outOfStockMaterialsList.length;
    const reorderRequiredCount = lowStockMaterialsCount + outOfStockMaterialsCount;

    const totalInventoryQuantity = rawMaterialsList.reduce((sum, m) => sum + (m.currentStock || 0), 0);
    const totalTransactionsCount = await Inventory.countDocuments();

    // Chart 1: Stock Levels vs Reorder Level (Top 8 materials)
    const stockLevelsChart = rawMaterialsList.slice(0, 8).map((m) => ({
      name: m.materialName.length > 12 ? m.materialName.substring(0, 11) + '…' : m.materialName,
      fullName: m.materialName,
      code: m.materialId,
      currentStock: m.currentStock,
      reorderLevel: m.reorderLevel,
      minimumStock: m.minimumStock,
      maximumStock: m.maximumStock,
      unit: m.unit,
      status: m.status,
    }));

    // Chart 2: IN vs OUT Summary & Material Usage
    const allTransactions = await Inventory.find();
    let totalInQty = 0;
    let totalOutQty = 0;
    let totalAdjustmentQty = 0;

    allTransactions.forEach((txn) => {
      if (txn.transactionType === 'IN') totalInQty += txn.quantity || 0;
      else if (txn.transactionType === 'OUT') totalOutQty += txn.quantity || 0;
      else if (txn.transactionType === 'ADJUSTMENT') totalAdjustmentQty += txn.quantity || 0;
    });

    const inVsOutChart = [
      { name: 'Stock Received (IN)', quantity: totalInQty, color: '#16a34a' },
      { name: 'Stock Dispatched (OUT)', quantity: totalOutQty, color: '#dc2626' },
      { name: 'Adjustments', quantity: totalAdjustmentQty, color: '#d97706' },
    ];

    // Material usage summary (Top consumed materials)
    const materialUsageMap = {};
    allTransactions
      .filter((t) => t.transactionType === 'OUT')
      .forEach((t) => {
        const matId = String(t.materialId);
        materialUsageMap[matId] = (materialUsageMap[matId] || 0) + (t.quantity || 0);
      });

    const materialUsageSummary = rawMaterialsList
      .map((m) => ({
        materialId: m._id,
        materialCode: m.materialId,
        materialName: m.materialName,
        category: m.category,
        unit: m.unit,
        currentStock: m.currentStock,
        reorderLevel: m.reorderLevel,
        consumedQuantity: materialUsageMap[String(m._id)] || 0,
        unitCost: m.unitCost,
        totalValue: (m.currentStock * m.unitCost).toFixed(2),
        supplier: m.supplier,
        status: m.status,
      }))
      .sort((a, b) => b.consumedQuantity - a.consumedQuantity)
      .slice(0, 6);

    const payload = {
      role: 'Inventory Manager',
      stats: {
        totalMaterials,
        lowStockMaterials: lowStockMaterialsCount,
        outOfStockMaterials: outOfStockMaterialsCount,
        totalInventoryQuantity,
        totalTransactions: totalTransactionsCount,
        reorderRequired: reorderRequiredCount,
      },
      lowStockMaterials: lowStockMaterialsList,
      outOfStockMaterials: outOfStockMaterialsList,
      recentTransactions: inventoryTransactions,
      rawMaterialStockLevels: stockLevelsChart,
      reorderAlerts: inventoryAlerts,
      inVsOutSummary: {
        totalIn: totalInQty,
        totalOut: totalOutQty,
        totalAdjustment: totalAdjustmentQty,
        netStockChange: totalInQty - totalOutQty,
      },
      materialUsage: materialUsageSummary,
      charts: {
        stockLevels: stockLevelsChart,
        inVsOut: inVsOutChart,
        inventoryStatus: [
          { name: 'Available', value: rawMaterialsList.length - reorderRequiredCount, color: '#16a34a' },
          { name: 'Low Stock', value: lowStockMaterialsCount, color: '#d97706' },
          { name: 'Out of Stock', value: outOfStockMaterialsCount, color: '#dc2626' },
        ],
      },
    };

    res.json({
      success: true,
      data: payload,
      ...payload,
    });
  } catch (error) {
    next(error);
  }
};

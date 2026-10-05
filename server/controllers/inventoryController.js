const Inventory = require('../models/Inventory');
const RawMaterial = require('../models/RawMaterial');
const { getNextId } = require('../utils/generateId');
const { checkLowStockAlerts } = require('../utils/alertService');

exports.getInventory = async (req, res, next) => {
  try {
    const { materialId, transactionType } = req.query;
    const filter = {};
    if (materialId) filter.materialId = materialId;
    if (transactionType) filter.transactionType = transactionType;
    const transactions = await Inventory.find(filter)
      .populate('materialId', 'materialName materialId unit currentStock')
      .sort({ transactionDate: -1 });
    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (error) { next(error); }
};

exports.getInventoryById = async (req, res, next) => {
  try {
    const txn = await Inventory.findById(req.params.id).populate('materialId');
    if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, data: txn });
  } catch (error) { next(error); }
};

exports.createInventoryTransaction = async (req, res, next) => {
  try {
    const { materialId, transactionType, quantity } = req.body;

    const material = await RawMaterial.findById(materialId);
    if (!material) return res.status(404).json({ success: false, message: 'Raw material not found' });

    // Apply stock change
    if (transactionType === 'IN') {
      material.currentStock += quantity;
    } else if (transactionType === 'OUT') {
      if (material.currentStock < quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${material.currentStock} ${material.unit}` });
      }
      material.currentStock -= quantity;
    } else if (transactionType === 'ADJUSTMENT') {
      if (quantity < 0) {
        return res.status(400).json({ success: false, message: 'Adjustment quantity cannot be negative. Use OUT for stock reduction.' });
      }
      material.currentStock = quantity; // Absolute value
    }

    await material.save(); // triggers status pre-save hook

    const inventoryId = await getNextId(Inventory, 'inventoryId', 'INV');
    const transaction = await Inventory.create({ ...req.body, inventoryId });

    // Check for low stock alerts after transaction
    await checkLowStockAlerts();

    const populated = await transaction.populate('materialId', 'materialName materialId unit currentStock status');
    res.status(201).json({ success: true, data: populated, updatedStock: material.currentStock });
  } catch (error) { next(error); }
};

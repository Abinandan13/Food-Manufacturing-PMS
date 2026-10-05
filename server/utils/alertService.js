const Alert = require('../models/Alert');
const { getNextId } = require('./generateId');

/**
 * Creates an alert if one of the same type and relatedId doesn't already exist (unread).
 */
const createAlert = async ({ type, title, message, severity, relatedId }) => {
  try {
    // Avoid duplicate unread alerts
    const existing = await Alert.findOne({ type, relatedId, isRead: false });
    if (existing) return null;

    const alertId = await getNextId(Alert, 'alertId', 'ALERT');
    const alert = await Alert.create({ alertId, type, title, message, severity, relatedId });
    return alert;
  } catch (error) {
    console.error('Alert creation error:', error.message);
    return null;
  }
};

/**
 * Check raw material stock and create LOW_STOCK alerts where needed.
 */
const checkLowStockAlerts = async () => {
  try {
    const RawMaterial = require('../models/RawMaterial');
    const lowStockMaterials = await RawMaterial.find({
      $expr: { $lte: ['$currentStock', '$reorderLevel'] },
    });

    for (const material of lowStockMaterials) {
      await createAlert({
        type: 'LOW_STOCK',
        title: `Low Stock: ${material.materialName}`,
        message: `${material.materialName} stock (${material.currentStock} ${material.unit}) is at or below reorder level (${material.reorderLevel} ${material.unit}).`,
        severity: material.currentStock === 0 ? 'Critical' : 'High',
        relatedId: material.materialId,
      });
    }
  } catch (error) {
    console.error('Low stock check error:', error.message);
  }
};

module.exports = { createAlert, checkLowStockAlerts };

const BOM = require('../models/BOM');
const RawMaterial = require('../models/RawMaterial');
const { getNextId } = require('../utils/generateId');

exports.getBOMs = async (req, res, next) => {
  try {
    const { productId } = req.query;
    const filter = productId ? { productId } : {};
    const boms = await BOM.find(filter)
      .populate('productId', 'productName productId')
      .populate('materialId', 'materialName materialId unit currentStock')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: boms.length, data: boms });
  } catch (error) { next(error); }
};

exports.getBOM = async (req, res, next) => {
  try {
    const bom = await BOM.findById(req.params.id)
      .populate('productId', 'productName productId')
      .populate('materialId', 'materialName materialId unit currentStock');
    if (!bom) return res.status(404).json({ success: false, message: 'BOM entry not found' });
    res.json({ success: true, data: bom });
  } catch (error) { next(error); }
};

exports.createBOM = async (req, res, next) => {
  try {
    const bomId = await getNextId(BOM, 'bomId', 'BOM');
    const bom = await BOM.create({ ...req.body, bomId });
    const populated = await bom.populate([
      { path: 'productId', select: 'productName productId' },
      { path: 'materialId', select: 'materialName materialId unit' },
    ]);
    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

exports.updateBOM = async (req, res, next) => {
  try {
    const bom = await BOM.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('productId', 'productName productId')
      .populate('materialId', 'materialName materialId unit');
    if (!bom) return res.status(404).json({ success: false, message: 'BOM entry not found' });
    res.json({ success: true, data: bom });
  } catch (error) { next(error); }
};

exports.deleteBOM = async (req, res, next) => {
  try {
    const bom = await BOM.findByIdAndDelete(req.params.id);
    if (!bom) return res.status(404).json({ success: false, message: 'BOM entry not found' });
    res.json({ success: true, message: 'BOM entry deleted successfully' });
  } catch (error) { next(error); }
};

// @desc   Calculate material requirements for a given production quantity
// @route  GET /api/bom/product/:productId/requirements?quantity=N
exports.getMaterialRequirements = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const quantity = parseFloat(req.query.quantity) || 1;

    const boms = await BOM.find({ productId })
      .populate('materialId', 'materialName materialId unit currentStock reorderLevel status');

    if (!boms.length) {
      return res.status(404).json({ success: false, message: 'No BOM entries found for this product' });
    }

    const requirements = boms.map((bom) => {
      const required = parseFloat((bom.quantityPerUnit * quantity).toFixed(4));
      const available = bom.materialId?.currentStock || 0;
      const shortage = Math.max(0, required - available);
      return {
        materialId: bom.materialId?._id,
        materialName: bom.materialId?.materialName,
        materialCode: bom.materialId?.materialId,
        unit: bom.unit || bom.materialId?.unit,
        quantityPerUnit: bom.quantityPerUnit,
        requiredQuantity: required,
        availableStock: available,
        shortage,
        isSufficient: available >= required,
        currentStatus: bom.materialId?.status,
      };
    });

    res.json({
      success: true,
      productionQuantity: quantity,
      data: requirements,
      summary: {
        totalMaterials: requirements.length,
        materialsWithShortage: requirements.filter((r) => !r.isSufficient).length,
        allMaterialsSufficient: requirements.every((r) => r.isSufficient),
      },
    });
  } catch (error) { next(error); }
};

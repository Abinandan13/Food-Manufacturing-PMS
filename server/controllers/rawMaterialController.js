const RawMaterial = require('../models/RawMaterial');
const { getNextId } = require('../utils/generateId');

exports.getRawMaterials = async (req, res, next) => {
  try {
    const { status, category, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) filter.$or = [
      { materialName: { $regex: search, $options: 'i' } },
      { supplier: { $regex: search, $options: 'i' } },
    ];
    const materials = await RawMaterial.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: materials.length, data: materials });
  } catch (error) { next(error); }
};

exports.getRawMaterial = async (req, res, next) => {
  try {
    const material = await RawMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Raw material not found' });
    res.json({ success: true, data: material });
  } catch (error) { next(error); }
};

exports.createRawMaterial = async (req, res, next) => {
  try {
    const materialId = await getNextId(RawMaterial, 'materialId', 'MAT');
    const material = await RawMaterial.create({ ...req.body, materialId });
    res.status(201).json({ success: true, data: material });
  } catch (error) { next(error); }
};

exports.updateRawMaterial = async (req, res, next) => {
  try {
    // Use findById + save to trigger pre-save hook for status
    const material = await RawMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Raw material not found' });
    Object.assign(material, req.body);
    await material.save();
    res.json({ success: true, data: material });
  } catch (error) { next(error); }
};

exports.deleteRawMaterial = async (req, res, next) => {
  try {
    const material = await RawMaterial.findByIdAndDelete(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Raw material not found' });
    res.json({ success: true, message: 'Raw material deleted successfully' });
  } catch (error) { next(error); }
};

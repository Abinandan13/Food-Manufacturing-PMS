const ManufacturingProgress = require('../models/ManufacturingProgress');
const ProductionPlan = require('../models/ProductionPlan');
const { getNextId } = require('../utils/generateId');
const { createAlert } = require('../utils/alertService');

exports.getProgress = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const records = await ManufacturingProgress.find(filter)
      .populate({
        path: 'productionPlanId',
        populate: { path: 'productId', select: 'productName productId' },
      })
      .sort({ updatedAt: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (error) { next(error); }
};

exports.getProgressById = async (req, res, next) => {
  try {
    const record = await ManufacturingProgress.findById(req.params.id).populate({
      path: 'productionPlanId',
      populate: { path: 'productId', select: 'productName productId' },
    });
    if (!record) return res.status(404).json({ success: false, message: 'Progress record not found' });
    res.json({ success: true, data: record });
  } catch (error) { next(error); }
};

exports.createProgress = async (req, res, next) => {
  try {
    const progressId = await getNextId(ManufacturingProgress, 'progressId', 'PROG');
    const record = await ManufacturingProgress.create({ ...req.body, progressId });
    res.status(201).json({ success: true, data: record });
  } catch (error) { next(error); }
};

exports.updateProgress = async (req, res, next) => {
  try {
    const record = await ManufacturingProgress.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Progress record not found' });

    Object.assign(record, req.body);
    await record.save(); // triggers progressPercentage calculation

    // Update production plan status accordingly
    if (record.status === 'Completed') {
      await ProductionPlan.findByIdAndUpdate(record.productionPlanId, { status: 'Completed' });
      await createAlert({
        type: 'PRODUCTION_COMPLETED',
        title: `Production Completed`,
        message: `Manufacturing progress ${record.progressId} has reached 100% completion.`,
        severity: 'Low',
        relatedId: record.progressId,
      });
    }
    if (record.status === 'Delayed') {
      await ProductionPlan.findByIdAndUpdate(record.productionPlanId, { status: 'Delayed' });
    }

    const populated = await record.populate({
      path: 'productionPlanId',
      populate: { path: 'productId', select: 'productName productId' },
    });

    res.json({ success: true, data: populated });
  } catch (error) { next(error); }
};

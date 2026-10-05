const Demand = require('../models/Demand');
const { getNextId } = require('../utils/generateId');
const { createAlert } = require('../utils/alertService');

exports.getDemands = async (req, res, next) => {
  try {
    const { status, priority, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.customerName = { $regex: search, $options: 'i' };
    const demands = await Demand.find(filter).populate('productId', 'productName productId unit').sort({ createdAt: -1 });
    res.json({ success: true, count: demands.length, data: demands });
  } catch (error) { next(error); }
};

exports.getDemand = async (req, res, next) => {
  try {
    const demand = await Demand.findById(req.params.id).populate('productId');
    if (!demand) return res.status(404).json({ success: false, message: 'Demand not found' });
    res.json({ success: true, data: demand });
  } catch (error) { next(error); }
};

exports.createDemand = async (req, res, next) => {
  try {
    const demandId = await getNextId(Demand, 'demandId', 'DEM');
    const demand = await Demand.create({ ...req.body, demandId });
    const populated = await demand.populate('productId', 'productName');

    // Create PENDING_DEMAND alert
    await createAlert({
      type: 'PENDING_DEMAND',
      title: `New Demand: ${populated.productId?.productName || 'Product'}`,
      message: `New demand from ${demand.customerName} for quantity ${demand.quantity}. Priority: ${demand.priority}.`,
      severity: demand.priority === 'Urgent' ? 'High' : 'Medium',
      relatedId: demandId,
    });

    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

exports.updateDemand = async (req, res, next) => {
  try {
    const demand = await Demand.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('productId', 'productName productId unit');
    if (!demand) return res.status(404).json({ success: false, message: 'Demand not found' });
    res.json({ success: true, data: demand });
  } catch (error) { next(error); }
};

exports.deleteDemand = async (req, res, next) => {
  try {
    const demand = await Demand.findByIdAndDelete(req.params.id);
    if (!demand) return res.status(404).json({ success: false, message: 'Demand not found' });
    res.json({ success: true, message: 'Demand deleted successfully' });
  } catch (error) { next(error); }
};

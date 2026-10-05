const Alert = require('../models/Alert');
const { getNextId } = require('../utils/generateId');

exports.getAlerts = async (req, res, next) => {
  try {
    const { isRead, severity, type } = req.query;
    const filter = {};
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (severity) filter.severity = severity;
    if (type) filter.type = type;
    const alerts = await Alert.find(filter).sort({ createdAt: -1 });
    const unreadCount = await Alert.countDocuments({ isRead: false });
    res.json({ success: true, count: alerts.length, unreadCount, data: alerts });
  } catch (error) { next(error); }
};

exports.markRead = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, data: alert });
  } catch (error) { next(error); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Alert.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (error) { next(error); }
};

exports.deleteAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, message: 'Alert deleted successfully' });
  } catch (error) { next(error); }
};

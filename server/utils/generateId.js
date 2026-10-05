/**
 * Generates a sequential ID with a prefix and zero-padded number.
 * e.g. generateId('PROD', 5) => 'PROD-005'
 */
const generateId = (prefix, number) => {
  return `${prefix}-${String(number).padStart(3, '0')}`;
};

/**
 * Gets the next sequential ID for a model.
 * Finds the document with the highest numeric ID and increments.
 */
const getNextId = async (Model, idField, prefix) => {
  const last = await Model.findOne({}).sort({ [idField]: -1 }).select(idField);
  if (!last || !last[idField]) return `${prefix}-001`;

  const lastNum = parseInt(last[idField].split('-')[1], 10);
  return generateId(prefix, lastNum + 1);
};

module.exports = { generateId, getNextId };

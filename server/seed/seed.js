const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Product = require('../models/Product');
const RawMaterial = require('../models/RawMaterial');
const BOM = require('../models/BOM');
const Demand = require('../models/Demand');
const ProductionPlan = require('../models/ProductionPlan');
const Inventory = require('../models/Inventory');
const ManufacturingProgress = require('../models/ManufacturingProgress');
const Alert = require('../models/Alert');

const seedDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is not set in .env. Please configure your MongoDB Atlas connection.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'food_manufacturing_db' });
    console.log('✅ Connected to MongoDB Atlas');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      RawMaterial.deleteMany({}),
      BOM.deleteMany({}),
      Demand.deleteMany({}),
      ProductionPlan.deleteMany({}),
      Inventory.deleteMany({}),
      ManufacturingProgress.deleteMany({}),
      Alert.deleteMany({}),
    ]);

    // ── USERS ──────────────────────────────────────────────
    console.log('👤 Creating users...');
    const users = await User.create([
      { username: 'admin', email: 'admin@foodmfg.com', password: 'admin123', role: 'Admin' },
      { username: 'prod_manager', email: 'prodmgr@foodmfg.com', password: 'manager123', role: 'Production Manager' },
      { username: 'inv_manager', email: 'invmgr@foodmfg.com', password: 'manager123', role: 'Inventory Manager' },
    ]);

    // ── PRODUCTS ───────────────────────────────────────────
    console.log('📦 Creating products...');
    const products = await Product.create([
      { productId: 'PROD-001', productName: 'Whole Wheat Bread', category: 'Bread', description: 'Nutritious whole wheat bread loaf', unit: 'loaves', price: 45, productionTime: 3, status: 'Active' },
      { productId: 'PROD-002', productName: 'Butter Biscuits', category: 'Biscuits', description: 'Crispy butter biscuits pack', unit: 'packs', price: 30, productionTime: 2, status: 'Active' },
      { productId: 'PROD-003', productName: 'Vanilla Sponge Cake', category: 'Cakes', description: 'Soft vanilla sponge cake', unit: 'cakes', price: 120, productionTime: 4, status: 'Active' },
      { productId: 'PROD-004', productName: 'Chocolate Cookies', category: 'Cookies', description: 'Rich chocolate chip cookies', unit: 'packs', price: 55, productionTime: 2, status: 'Active' },
      { productId: 'PROD-005', productName: 'Tomato Sauce', category: 'Sauces', description: 'Fresh tomato cooking sauce', unit: 'bottles', price: 65, productionTime: 1.5, status: 'Active' },
    ]);

    // ── RAW MATERIALS ──────────────────────────────────────
    console.log('🪣 Creating raw materials...');
    const materials = await RawMaterial.create([
      { materialId: 'MAT-001', materialName: 'Wheat Flour', category: 'Flour', unit: 'kg', currentStock: 500, minimumStock: 100, maximumStock: 1000, reorderLevel: 150, supplier: 'GrainMill Co.', unitCost: 25, status: 'Available' },
      { materialId: 'MAT-002', materialName: 'Sugar', category: 'Sweeteners', unit: 'kg', currentStock: 80, minimumStock: 50, maximumStock: 300, reorderLevel: 100, supplier: 'SweetCane Ltd.', unitCost: 40, status: 'Low Stock' },
      { materialId: 'MAT-003', materialName: 'Butter', category: 'Dairy', unit: 'kg', currentStock: 60, minimumStock: 20, maximumStock: 200, reorderLevel: 40, supplier: 'DairyCrest Co.', unitCost: 180, status: 'Available' },
      { materialId: 'MAT-004', materialName: 'Eggs', category: 'Dairy', unit: 'units', currentStock: 1200, minimumStock: 200, maximumStock: 3000, reorderLevel: 300, supplier: 'FreshFarm Eggs', unitCost: 6, status: 'Available' },
      { materialId: 'MAT-005', materialName: 'Yeast', category: 'Leavening', unit: 'kg', currentStock: 15, minimumStock: 5, maximumStock: 50, reorderLevel: 20, supplier: 'BioYeast Corp.', unitCost: 300, status: 'Low Stock' },
      { materialId: 'MAT-006', materialName: 'Cocoa Powder', category: 'Flavoring', unit: 'kg', currentStock: 45, minimumStock: 10, maximumStock: 150, reorderLevel: 20, supplier: 'ChocoBean Imports', unitCost: 250, status: 'Available' },
      { materialId: 'MAT-007', materialName: 'Tomatoes', category: 'Vegetables', unit: 'kg', currentStock: 200, minimumStock: 50, maximumStock: 500, reorderLevel: 80, supplier: 'FreshVeg Farms', unitCost: 30, status: 'Available' },
      { materialId: 'MAT-008', materialName: 'Salt', category: 'Seasoning', unit: 'kg', currentStock: 0, minimumStock: 5, maximumStock: 100, reorderLevel: 10, supplier: 'OceanSalt Co.', unitCost: 15, status: 'Out of Stock' },
    ]);

    const [flour, sugar, butter, eggs, yeast, cocoa, tomatoes, salt] = materials;
    const [bread, biscuits, cake, cookies, sauce] = products;

    // ── BOM ────────────────────────────────────────────────
    console.log('📄 Creating Bill of Materials...');
    await BOM.create([
      // Whole Wheat Bread
      { bomId: 'BOM-001', productId: bread._id, materialId: flour._id, quantityPerUnit: 0.25, unit: 'kg' },
      { bomId: 'BOM-002', productId: bread._id, materialId: sugar._id, quantityPerUnit: 0.03, unit: 'kg' },
      { bomId: 'BOM-003', productId: bread._id, materialId: yeast._id, quantityPerUnit: 0.01, unit: 'kg' },
      { bomId: 'BOM-004', productId: bread._id, materialId: salt._id, quantityPerUnit: 0.005, unit: 'kg' },
      // Butter Biscuits
      { bomId: 'BOM-005', productId: biscuits._id, materialId: flour._id, quantityPerUnit: 0.15, unit: 'kg' },
      { bomId: 'BOM-006', productId: biscuits._id, materialId: sugar._id, quantityPerUnit: 0.08, unit: 'kg' },
      { bomId: 'BOM-007', productId: biscuits._id, materialId: butter._id, quantityPerUnit: 0.10, unit: 'kg' },
      // Vanilla Sponge Cake
      { bomId: 'BOM-008', productId: cake._id, materialId: flour._id, quantityPerUnit: 0.20, unit: 'kg' },
      { bomId: 'BOM-009', productId: cake._id, materialId: sugar._id, quantityPerUnit: 0.15, unit: 'kg' },
      { bomId: 'BOM-010', productId: cake._id, materialId: butter._id, quantityPerUnit: 0.12, unit: 'kg' },
      { bomId: 'BOM-011', productId: cake._id, materialId: eggs._id, quantityPerUnit: 2, unit: 'units' },
      // Chocolate Cookies
      { bomId: 'BOM-012', productId: cookies._id, materialId: flour._id, quantityPerUnit: 0.12, unit: 'kg' },
      { bomId: 'BOM-013', productId: cookies._id, materialId: sugar._id, quantityPerUnit: 0.10, unit: 'kg' },
      { bomId: 'BOM-014', productId: cookies._id, materialId: butter._id, quantityPerUnit: 0.08, unit: 'kg' },
      { bomId: 'BOM-015', productId: cookies._id, materialId: cocoa._id, quantityPerUnit: 0.05, unit: 'kg' },
      // Tomato Sauce
      { bomId: 'BOM-016', productId: sauce._id, materialId: tomatoes._id, quantityPerUnit: 0.60, unit: 'kg' },
      { bomId: 'BOM-017', productId: sauce._id, materialId: sugar._id, quantityPerUnit: 0.02, unit: 'kg' },
      { bomId: 'BOM-018', productId: sauce._id, materialId: salt._id, quantityPerUnit: 0.01, unit: 'kg' },
    ]);

    // ── DEMANDS ────────────────────────────────────────────
    console.log('📋 Creating demands...');
    const now = new Date();
    const demands = await Demand.create([
      { demandId: 'DEM-001', productId: bread._id, customerName: 'Metro Supermarket', quantity: 500, demandDate: new Date(now - 5 * 86400000), dueDate: new Date(now + 5 * 86400000), priority: 'High', status: 'Approved', notes: 'Weekly bread supply' },
      { demandId: 'DEM-002', productId: cookies._id, customerName: 'City Bakery Chain', quantity: 200, demandDate: new Date(now - 3 * 86400000), dueDate: new Date(now + 7 * 86400000), priority: 'Medium', status: 'In Production', notes: 'Festival order' },
      { demandId: 'DEM-003', productId: cake._id, customerName: 'Sweet Celebrations', quantity: 50, demandDate: new Date(now - 2 * 86400000), dueDate: new Date(now + 3 * 86400000), priority: 'Urgent', status: 'Pending', notes: 'Corporate event cakes' },
      { demandId: 'DEM-004', productId: biscuits._id, customerName: 'Quick Mart', quantity: 300, demandDate: new Date(now - 1 * 86400000), dueDate: new Date(now + 10 * 86400000), priority: 'Low', status: 'Pending' },
      { demandId: 'DEM-005', productId: sauce._id, customerName: 'Italian Kitchen', quantity: 150, demandDate: new Date(now - 7 * 86400000), dueDate: new Date(now + 2 * 86400000), priority: 'High', status: 'Completed' },
    ]);

    // ── PRODUCTION PLANS ───────────────────────────────────
    console.log('🏭 Creating production plans...');
    const plans = await ProductionPlan.create([
      { planId: 'PLAN-001', productId: bread._id, demandId: demands[0]._id, plannedQuantity: 500, startDate: new Date(now - 2 * 86400000), endDate: new Date(now + 3 * 86400000), priority: 'High', status: 'In Progress', notes: 'Running on schedule' },
      { planId: 'PLAN-002', productId: cookies._id, demandId: demands[1]._id, plannedQuantity: 200, startDate: new Date(now - 1 * 86400000), endDate: new Date(now + 6 * 86400000), priority: 'Medium', status: 'Scheduled' },
      { planId: 'PLAN-003', productId: cake._id, demandId: demands[2]._id, plannedQuantity: 50, startDate: new Date(now), endDate: new Date(now + 2 * 86400000), priority: 'Urgent', status: 'Planned' },
      { planId: 'PLAN-004', productId: sauce._id, plannedQuantity: 150, startDate: new Date(now - 10 * 86400000), endDate: new Date(now - 3 * 86400000), priority: 'High', status: 'Completed' },
    ]);

    // ── INVENTORY TRANSACTIONS ─────────────────────────────
    console.log('🗂️  Creating inventory transactions...');
    await Inventory.create([
      { inventoryId: 'INV-001', materialId: flour._id, transactionType: 'IN', quantity: 500, reference: 'PO-2024-001', remarks: 'Initial stock receipt', transactionDate: new Date(now - 10 * 86400000) },
      { inventoryId: 'INV-002', materialId: sugar._id, transactionType: 'IN', quantity: 80, reference: 'PO-2024-002', remarks: 'Initial stock receipt', transactionDate: new Date(now - 10 * 86400000) },
      { inventoryId: 'INV-003', materialId: flour._id, transactionType: 'OUT', quantity: 125, reference: 'PLAN-001', remarks: 'Bread production batch', transactionDate: new Date(now - 2 * 86400000) },
      { inventoryId: 'INV-004', materialId: yeast._id, transactionType: 'IN', quantity: 15, reference: 'PO-2024-003', remarks: 'Emergency restock', transactionDate: new Date(now - 1 * 86400000) },
      { inventoryId: 'INV-005', materialId: tomatoes._id, transactionType: 'OUT', quantity: 90, reference: 'PLAN-004', remarks: 'Tomato sauce production', transactionDate: new Date(now - 8 * 86400000) },
    ]);

    // ── MANUFACTURING PROGRESS ─────────────────────────────
    console.log('⚙️  Creating manufacturing progress...');
    await ManufacturingProgress.create([
      { progressId: 'PROG-001', productionPlanId: plans[0]._id, plannedQuantity: 500, completedQuantity: 320, rejectedQuantity: 5, status: 'In Progress', startTime: new Date(now - 2 * 86400000), remarks: 'On track, 64% done' },
      { progressId: 'PROG-002', productionPlanId: plans[3]._id, plannedQuantity: 150, completedQuantity: 150, rejectedQuantity: 0, status: 'Completed', startTime: new Date(now - 10 * 86400000), endTime: new Date(now - 3 * 86400000), remarks: 'Completed successfully' },
    ]);

    // ── ALERTS ─────────────────────────────────────────────
    console.log('🔔 Creating alerts...');
    await Alert.create([
      { alertId: 'ALERT-001', type: 'LOW_STOCK', title: 'Low Stock: Sugar', message: 'Sugar stock (80 kg) is at or below reorder level (100 kg). Please reorder.', severity: 'High', relatedId: 'MAT-002', isRead: false },
      { alertId: 'ALERT-002', type: 'LOW_STOCK', title: 'Low Stock: Yeast', message: 'Yeast stock (15 kg) is at or below reorder level (20 kg).', severity: 'High', relatedId: 'MAT-005', isRead: false },
      { alertId: 'ALERT-003', type: 'LOW_STOCK', title: 'Out of Stock: Salt', message: 'Salt is completely out of stock. Immediate reorder required.', severity: 'Critical', relatedId: 'MAT-008', isRead: false },
      { alertId: 'ALERT-004', type: 'PENDING_DEMAND', title: 'Urgent Demand Pending', message: 'Urgent demand DEM-003 from Sweet Celebrations for 50 cakes is awaiting approval.', severity: 'High', relatedId: 'DEM-003', isRead: false },
      { alertId: 'ALERT-005', type: 'PRODUCTION_COMPLETED', title: 'Production Completed: Tomato Sauce', message: 'Production plan PLAN-004 for Tomato Sauce has been completed.', severity: 'Low', relatedId: 'PLAN-004', isRead: true },
    ]);

    console.log('\n✅ Database seeded successfully!');
    console.log('─────────────────────────────────────────');
    console.log('Test credentials:');
    console.log('  Admin: admin / admin123');
    console.log('  Production Manager: prod_manager / manager123');
    console.log('  Inventory Manager: inv_manager / manager123');
    console.log('─────────────────────────────────────────');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();

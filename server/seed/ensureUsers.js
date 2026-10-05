const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const defaultUsers = [
  { username: 'admin', email: 'admin@foodmfg.com', password: 'admin123', role: 'Admin', name: 'System Administrator', status: 'Active' },
  { username: 'prod_manager', email: 'prodmgr@foodmfg.com', password: 'manager123', role: 'Production Manager', name: 'Production Manager', status: 'Active' },
  { username: 'inv_manager', email: 'invmgr@foodmfg.com', password: 'manager123', role: 'Inventory Manager', name: 'Inventory Manager', status: 'Active' },
];

const ensureUsers = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is not set in .env');
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI, { dbName: 'food_manufacturing_db' });
    }

    console.log('🔍 Verifying essential system user accounts...');

    for (const u of defaultUsers) {
      const existing = await User.findOne({
        $or: [{ username: u.username }, { email: u.email }],
      }).select('+password');

      if (!existing) {
        await User.create(u);
        console.log(`✅ Created missing user: ${u.username} (${u.role})`);
      } else {
        let updated = false;
        if (existing.role !== u.role) {
          existing.role = u.role;
          updated = true;
        }
        if (!existing.name) {
          existing.name = u.name;
          updated = true;
        }
        const matches = await existing.matchPassword(u.password);
        if (!matches) {
          existing.password = u.password; // Triggers pre-save bcrypt hash
          updated = true;
        }
        if (updated) {
          await existing.save();
          console.log(`🔄 Updated user credentials/role: ${u.username} (${u.role})`);
        } else {
          console.log(`✔ User verified and ready: ${u.username} (${u.role})`);
        }
      }
    }
    console.log('✅ All 3 essential roles (Admin, Production Manager, Inventory Manager) are active in DB.');
  } catch (error) {
    console.error('❌ ensureUsers failed:', error.message);
  }
};

if (require.main === module) {
  ensureUsers().then(() => mongoose.disconnect().then(() => process.exit(0)));
}

module.exports = ensureUsers;

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️  MONGODB_URI is not set. Running without database connection.');
    console.warn('    Add your MongoDB Atlas URI to server/.env to enable database features.');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'food_manufacturing_db',
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

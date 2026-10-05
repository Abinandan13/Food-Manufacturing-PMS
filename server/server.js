require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const productRoutes = require('./routes/products');
const demandRoutes = require('./routes/demands');
const productionPlanRoutes = require('./routes/productionPlans');
const rawMaterialRoutes = require('./routes/rawMaterials');
const bomRoutes = require('./routes/bom');
const inventoryRoutes = require('./routes/inventory');
const progressRoutes = require('./routes/progress');
const alertRoutes = require('./routes/alerts');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 8001;

// Connect to database
connectDB().then(() => {
  const ensureUsers = require('./seed/ensureUsers');
  ensureUsers();
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route (public)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  res.json({
    success: true,
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/demands', demandRoutes);
app.use('/api/demand', demandRoutes);
app.use('/api/production-plans', productionPlanRoutes);
app.use('/api/productionplans', productionPlanRoutes);
app.use('/api/raw-materials', rawMaterialRoutes);
app.use('/api/rawmaterials', rawMaterialRoutes);
app.use('/api/bom', bomRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/production-progress', progressRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Centralized error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

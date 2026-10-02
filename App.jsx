import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Demand from './pages/Demand';
import ProductionPlanning from './pages/ProductionPlanning';
import RawMaterialsInventory from './pages/RawMaterialsInventory';
import Inventory from './pages/Inventory';
import BOM from './pages/BOM';
import ManufacturingProgress from './pages/ManufacturingProgress';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login initialMode="register" />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            
            {/* Demands */}
            <Route path="demands" element={<Demand />} />
            <Route path="demand" element={<Navigate to="/demands" replace />} />
            
            {/* Production */}
            <Route path="production" element={<ProductionPlanning />} />
            <Route path="production-planning" element={<Navigate to="/production" replace />} />
            
            {/* Raw Materials & Inventory */}
            <Route path="raw-materials" element={<RawMaterialsInventory />} />
            <Route path="inventory" element={<Inventory />} />
            
            {/* BOM, Progress, Alerts, Reports */}
            <Route path="bom" element={<BOM />} />
            <Route path="progress" element={<ManufacturingProgress />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

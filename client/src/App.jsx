import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import ProductionDashboard from './pages/dashboards/ProductionDashboard';
import InventoryDashboard from './pages/dashboards/InventoryDashboard';

import Products from './pages/Products';
import Demand from './pages/Demand';
import ProductionPlanning from './pages/ProductionPlanning';
import RawMaterialsInventory from './pages/RawMaterialsInventory';
import Inventory from './pages/Inventory';
import BOM from './pages/BOM';
import ManufacturingProgress from './pages/ManufacturingProgress';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Dynamic role-based dashboard router */}
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Direct role dashboard routes with route protection */}
            <Route
              path="dashboard/admin"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard/production"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Production Manager']}>
                  <ProductionDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard/inventory"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Inventory Manager']}>
                  <InventoryDashboard />
                </ProtectedRoute>
              }
            />

            {/* Products: Admin & Production Manager */}
            <Route
              path="products"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Production Manager']}>
                  <Products />
                </ProtectedRoute>
              }
            />

            {/* Demands: Admin & Production Manager */}
            <Route
              path="demands"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Production Manager']}>
                  <Demand />
                </ProtectedRoute>
              }
            />
            <Route path="demand" element={<Navigate to="/demands" replace />} />

            {/* Production: Admin & Production Manager */}
            <Route
              path="production"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Production Manager']}>
                  <ProductionPlanning />
                </ProtectedRoute>
              }
            />
            <Route path="production-planning" element={<Navigate to="/production" replace />} />

            {/* Raw Materials & Inventory: Admin & Inventory Manager */}
            <Route
              path="raw-materials"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Inventory Manager']}>
                  <RawMaterialsInventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="inventory"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Inventory Manager']}>
                  <Inventory />
                </ProtectedRoute>
              }
            />

            {/* BOM: Admin & Inventory Manager */}
            <Route
              path="bom"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Inventory Manager']}>
                  <BOM />
                </ProtectedRoute>
              }
            />

            {/* Progress: Admin & Production Manager */}
            <Route
              path="progress"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Production Manager']}>
                  <ManufacturingProgress />
                </ProtectedRoute>
              }
            />

            {/* Alerts & Reports: Accessible by all authenticated roles */}
            <Route
              path="alerts"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Production Manager', 'Inventory Manager']}>
                  <Alerts />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Production Manager', 'Inventory Manager']}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            {/* User Management: Admin only */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

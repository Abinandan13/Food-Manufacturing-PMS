import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './dashboards/AdminDashboard';
import ProductionDashboard from './dashboards/ProductionDashboard';
import InventoryDashboard from './dashboards/InventoryDashboard';

function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner spinner-primary" style={{ width: 38, height: 38, borderWidth: 3 }} />
        <div>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Authenticating role session...</p>
        </div>
      </div>
    );
  }

  const role = user?.role;

  switch (role) {
    case 'Admin':
      return <AdminDashboard />;
    case 'Production Manager':
      return <ProductionDashboard />;
    case 'Inventory Manager':
      return <InventoryDashboard />;
    default:
      return <AdminDashboard />;
  }
}

export default Dashboard;

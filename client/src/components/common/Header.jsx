import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROUTE_META = {
  '/dashboard':            { title: 'Dashboard',             subtitle: 'Role-based manufacturing intelligence overview' },
  '/dashboard/admin':      { title: 'Admin Command Center',  subtitle: 'Complete manufacturing intelligence and operational command center' },
  '/dashboard/production': { title: 'Production Dashboard',   subtitle: 'Production scheduling, batch tracking, and demand fulfillment' },
  '/dashboard/inventory':  { title: 'Inventory Dashboard',    subtitle: 'Raw material inventory, stock levels, and supply chain tracking' },
  '/products':             { title: 'Product Management',    subtitle: 'Manage product catalog and specifications' },
  '/demands':              { title: 'Demand Management',     subtitle: 'Customer orders and demand forecasting' },
  '/production':           { title: 'Production Planning',   subtitle: 'Schedule and manage production runs' },
  '/raw-materials':        { title: 'Raw Materials',         subtitle: 'Material inventory and stock levels' },
  '/inventory':            { title: 'Inventory Ledger',      subtitle: 'Track inventory transactions and stock movements' },
  '/bom':                  { title: 'Bill of Materials',     subtitle: 'Product recipes and material requirements' },
  '/progress':             { title: 'Manufacturing Progress',subtitle: 'Monitor active production batches and floor execution' },
  '/alerts':               { title: 'System Alerts',         subtitle: 'Low stock, delays, and critical notifications' },
  '/reports':              { title: 'Analytics & Reports',   subtitle: 'Performance metrics and insights' },
};

function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const meta = ROUTE_META[location.pathname] || {
    title: 'Food Manufacturing PMS',
    subtitle: 'Production Management System',
  };

  const userName = user?.name || user?.username || 'User';
  const userRole = user?.role || 'Operator';

  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="app-header">
      {/* Left: Page title & breadcrumb */}
      <div className="header-left">
        <div className="header-breadcrumb">
          <div>
            <div className="header-title">{meta.title}</div>
            <div className="header-subtitle">{meta.subtitle}</div>
          </div>
        </div>
      </div>

      {/* Right: user information & notifications */}
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Link to="/alerts" className="header-icon-btn" title="View Notifications / Alerts">
          <Bell size={17} />
          <span className="header-status-dot" />
        </Link>

        <div className="header-divider" />

        <div
          className="header-user-chip"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 12px',
            borderRadius: 10,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <div className="header-user-avatar">{initials}</div>
          <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Welcome, {userName}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)' }}>
              Role: <span style={{ color: 'var(--text-secondary)' }}>{userRole}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

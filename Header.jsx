import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROUTE_META = {
  '/dashboard':    { title: 'Dashboard',             subtitle: 'Production intelligence overview' },
  '/products':     { title: 'Product Management',    subtitle: 'Manage product catalog and specifications' },
  '/demands':      { title: 'Demand Management',     subtitle: 'Customer orders and demand forecasting' },
  '/production':   { title: 'Production Planning',   subtitle: 'Schedule and manage production runs' },
  '/raw-materials':{ title: 'Raw Materials',         subtitle: 'Material inventory and stock levels' },
  '/inventory':    { title: 'Inventory',             subtitle: 'Track inventory transactions and stock' },
  '/bom':          { title: 'Bill of Materials',     subtitle: 'Product recipes and material requirements' },
  '/progress':     { title: 'Manufacturing Progress',subtitle: 'Monitor active production batches' },
  '/alerts':       { title: 'System Alerts',         subtitle: 'Low stock and critical notifications' },
  '/reports':      { title: 'Analytics & Reports',   subtitle: 'Performance metrics and insights' },
};

function Header() {
  const { user } = useAuth();
  const location = useLocation();
  const meta = ROUTE_META[location.pathname] || { title: 'Food Manufacturing PMS', subtitle: 'Production Management System' };

  const initials = (user?.username || user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="app-header">
      {/* Left: Page title */}
      <div className="header-left">
        <div className="header-breadcrumb">
          <div>
            <div className="header-title">{meta.title}</div>
            <div className="header-subtitle">{meta.subtitle}</div>
          </div>
        </div>
      </div>

      {/* Right: actions */}
      <div className="header-right">
        <button className="header-icon-btn" title="Notifications">
          <Bell size={17} />
          <span className="header-status-dot" />
        </button>

        <div className="header-divider" />

        <div className="header-user-chip">
          <div className="header-user-avatar">{initials}</div>
          <span className="header-user-name">{user?.username || user?.name || 'User'}</span>
        </div>
      </div>
    </header>
  );
}

export default Header;

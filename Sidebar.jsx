import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  CalendarDays,
  Wheat,
  Boxes,
  ScrollText,
  Activity,
  Bell,
  FileBarChart2,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard',    label: 'Dashboard',          icon: LayoutDashboard },
  { to: '/products',     label: 'Products',           icon: Package },
  { to: '/demands',      label: 'Demands',            icon: TrendingUp },
  { to: '/production',   label: 'Production',         icon: CalendarDays },
  { to: '/raw-materials',label: 'Raw Materials',      icon: Wheat },
  { to: '/inventory',    label: 'Inventory',          icon: Boxes },
  { to: '/bom',          label: 'Bill of Materials',  icon: ScrollText },
  { to: '/progress',     label: 'Mfg. Progress',      icon: Activity },
  { to: '/alerts',       label: 'Alerts',             icon: Bell },
  { to: '/reports',      label: 'Reports',            icon: FileBarChart2 },
];

function Sidebar() {
  const { user, logout } = useAuth();

  const initials = (user?.username || user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = user?.role
    ? user.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Operator';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🍲</div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">FoodManu PMS</div>
          <div className="sidebar-brand-sub">Production Management</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-item${isActive ? ' active' : ''}`
            }
          >
            <Icon size={17} className="sidebar-item-icon" />
            <span className="sidebar-item-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer user area */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.username || user?.name || 'User'}</div>
            <div className="sidebar-user-role">{roleLabel}</div>
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={logout}
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Users,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLE_NAV_ITEMS = {
  Admin: [
    { to: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/demands', label: 'Demands', icon: TrendingUp },
    { to: '/production', label: 'Production', icon: CalendarDays },
    { to: '/raw-materials', label: 'Raw Materials', icon: Wheat },
    { to: '/inventory', label: 'Inventory', icon: Boxes },
    { to: '/bom', label: 'Bill of Materials', icon: ScrollText },
    { to: '/progress', label: 'Mfg. Progress', icon: Activity },
    { to: '/alerts', label: 'Alerts', icon: Bell },
    { to: '/reports', label: 'Reports', icon: FileBarChart2 },
    { to: '/users', label: 'User Management', icon: Users },
  ],
  'Production Manager': [
    { to: '/dashboard/production', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/demands', label: 'Demands', icon: TrendingUp },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/production', label: 'Production', icon: CalendarDays },
    { to: '/progress', label: 'Mfg. Progress', icon: Activity },
    { to: '/reports', label: 'Reports', icon: FileBarChart2 },
  ],
  'Inventory Manager': [
    { to: '/dashboard/inventory', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/raw-materials', label: 'Raw Materials', icon: Wheat },
    { to: '/inventory', label: 'Inventory', icon: Boxes },
    { to: '/bom', label: 'Bill of Materials', icon: ScrollText },
    { to: '/alerts', label: 'Alerts', icon: Bell },
    { to: '/reports', label: 'Reports', icon: FileBarChart2 },
  ],
};

function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const userRole = user?.role || 'Admin';
  const navItems = ROLE_NAV_ITEMS[userRole] || ROLE_NAV_ITEMS.Admin;

  const initials = (user?.name || user?.username || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = userRole;

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🍲</div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">FoodManu PMS</div>
          <div className="sidebar-brand-sub">{roleLabel}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation · {roleLabel}</div>
        {navItems.map(({ to, label, icon: Icon }) => {
          const isDashboard = to.startsWith('/dashboard');
          const isActive = isDashboard
            ? location.pathname === to || location.pathname === '/dashboard' || (to === '/dashboard/admin' && location.pathname === '/dashboard')
            : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className={`sidebar-item${isActive ? ' active' : ''}`}
            >
              <Icon size={17} className="sidebar-item-icon" />
              <span className="sidebar-item-label">{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer user area */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name" title={user?.name || user?.username}>
              {user?.name || user?.username || 'User'}
            </div>
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

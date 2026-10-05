const fs = require('fs');

const clientBase = 'C:/Users/sabin/food-manufacturing-production/client/src';

// 1. Refined index.css
const cssCode = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* ── Professional Enterprise Light Design Tokens ── */
:root {
  --primary: #1d4ed8;
  --primary-hover: #1e40af;
  --primary-subtle: #eff6ff;
  --primary-border: #bfdbfe;

  --secondary: #0f766e;
  --secondary-subtle: #f0fdfa;

  --success: #059669;
  --success-subtle: #ecfdf5;
  --success-border: #a7f3d0;

  --warning: #d97706;
  --warning-subtle: #fffbeb;
  --warning-border: #fde68a;

  --danger: #dc2626;
  --danger-subtle: #fef2f2;
  --danger-border: #fecaca;

  --bg-page: #f8fafc;
  --bg-surface: #ffffff;
  --bg-subtle: #f1f5f9;
  --bg-hover: #f8fafc;

  --border: #e2e8f0;
  --border-strong: #cbd5e1;

  --text-main: #0f172a;
  --text-body: #334155;
  --text-muted: #64748b;
  --text-placeholder: #94a3b8;

  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius: 8px;
  --radius-md: 10px;
  --radius-lg: 12px;

  --shadow-xs: 0 1px 2px 0 rgba(15, 23, 42, 0.04);
  --shadow-sm: 0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05);

  --sidebar-width: 240px;
  --header-height: 56px;
  --transition: 0.15s ease-in-out;
}

/* ── Reset & Typography ── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: var(--text-main);
  background-color: var(--bg-page);
  -webkit-font-smoothing: antialiased;
}

body {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-body);
  background-color: var(--bg-page);
  min-height: 100vh;
}

a { color: inherit; text-decoration: none; }
button { cursor: pointer; font-family: inherit; }
input, select, textarea { font-family: inherit; }

/* ── Layout Shell ── */
.app-container {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-page);
}

.main-viewport {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content-area {
  flex: 1;
  padding: 20px 24px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

/* ── Cards & Panels ── */
.panel {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
  transition: border-color var(--transition), box-shadow var(--transition);
}

.panel:hover {
  border-color: var(--border-strong);
}

.panel-header {
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
}

.panel-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.15px;
}

.panel-body {
  padding: 18px;
}

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1;
  transition: all var(--transition);
  border: 1px solid transparent;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary);
  color: #ffffff;
  border-color: var(--primary);
  box-shadow: 0 1px 2px rgba(29, 78, 216, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
}

.btn-secondary {
  background: #ffffff;
  color: var(--text-body);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-xs);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-subtle);
  color: var(--text-main);
}

.btn-danger {
  background: #ffffff;
  color: var(--danger);
  border-color: var(--danger-border);
}

.btn-danger:hover:not(:disabled) {
  background: var(--danger-subtle);
}

.btn-sm {
  padding: 5px 10px;
  font-size: 11.5px;
  border-radius: var(--radius-xs);
}

/* ── Tables ── */
.table-responsive {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: #ffffff;
  box-shadow: var(--shadow-xs);
}

.ent-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  text-align: left;
}

.ent-table th {
  background: #f8fafc;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.ent-table td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--text-body);
  vertical-align: middle;
}

.ent-table tbody tr {
  transition: background-color var(--transition);
}

.ent-table tbody tr:hover {
  background-color: var(--bg-hover);
}

.ent-table tbody tr:last-child td {
  border-bottom: none;
}

/* ── Form Inputs ── */
.form-group {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-body);
  margin-bottom: 5px;
}

.form-control {
  width: 100%;
  background: #ffffff;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  padding: 7px 11px;
  font-size: 12.5px;
  transition: border-color var(--transition), box-shadow var(--transition);
  outline: none;
}

.form-control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.12);
}

.form-control::placeholder {
  color: var(--text-placeholder);
}

/* ── Status Badges ── */
.badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 4.5px;
  padding: 2.5px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  border: 1px solid transparent;
  white-space: nowrap;
}

/* ── Search & Filter Bars ── */
.toolbar-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  box-shadow: var(--shadow-xs);
  flex-wrap: wrap;
}

/* ── PRESERVED LOGIN PAGE STYLES ── */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
  position: relative;
  padding: 20px;
}

.login-card {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
}

.login-logo {
  text-align: center;
  margin-bottom: 28px;
}

.login-logo-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.login-logo h1 {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-main);
}

.login-logo p {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

.login-error {
  background: var(--danger-subtle);
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  color: #991b1b;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid #e2e8f0;
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

// 2. Header.jsx
const headerCode = `import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Menu, ShieldCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function Header({ title, onToggleSidebar, unreadAlertsCount = 0 }) {
  const { user } = useAuth();

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile hamburger + Page Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="text-slate-400 font-semibold tracking-wide uppercase text-[10px]">FoodManu OS</span>
          <ChevronRight size={12} className="text-slate-300" />
          <h1 className="text-sm font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Notification bell + User profile */}
      <div className="flex items-center gap-3">
        <Link
          to="/alerts"
          className="relative p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50/80 rounded-md transition-colors"
          title="System Alerts"
        >
          <Bell size={17} />
          {unreadAlertsCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-rose-600 text-white text-[9.5px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
              {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
            </span>
          ) : (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-600 rounded-full" />
          )}
        </Link>

        <div className="h-5 w-px bg-slate-200 mx-0.5" />

        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <p className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
              {user?.username || 'Operator'}
            </p>
            <div className="flex items-center gap-1">
              <ShieldCheck size={11} className="text-emerald-600" />
              <span className="text-[10px] font-medium text-slate-500 capitalize">
                {user?.role || 'Production Lead'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
`;

// 3. Sidebar.jsx
const sidebarCode = `import React from 'react';
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
  Factory,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_SECTIONS = [
  {
    heading: 'CORE MONITORING',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/alerts', label: 'Alerts', icon: Bell },
      { to: '/reports', label: 'Analytics & Reports', icon: FileBarChart2 },
    ],
  },
  {
    heading: 'PRODUCTION & PLANNING',
    items: [
      { to: '/products', label: 'Products', icon: Package },
      { to: '/demands', label: 'Customer Demands', icon: TrendingUp },
      { to: '/production', label: 'Production Planning', icon: CalendarDays },
      { to: '/progress', label: 'Floor Progress', icon: Activity },
    ],
  },
  {
    heading: 'MATERIALS & SUPPLY',
    items: [
      { to: '/raw-materials', label: 'Raw Materials', icon: Wheat },
      { to: '/inventory', label: 'Inventory Transactions', icon: Boxes },
      { to: '/bom', label: 'BOM & Recipes', icon: ScrollText },
    ],
  },
];

function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/35 z-40 md:hidden backdrop-blur-2xs transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={\`fixed md:static inset-y-0 left-0 z-50 w-60 bg-white text-slate-700 h-screen flex flex-col shrink-0 border-r border-slate-200 select-none shadow-xs transition-transform duration-200 ease-in-out \${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }\`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shadow-xs">
              <Factory size={18} />
            </div>
            <div>
              <h1 className="text-slate-900 font-bold text-sm leading-tight tracking-tight">FoodManu</h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Production PMS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 text-slate-400 hover:text-slate-700 rounded-md"
          >
            <X size={17} />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
          {NAV_SECTIONS.map((section, idx) => (
            <div key={idx}>
              <p className="px-2.5 mb-1.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                {section.heading}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        \`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all \${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-semibold border-l-3 border-blue-700'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }\`
                      }
                    >
                      <Icon size={16} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User profile footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate leading-tight">{user?.username || 'User'}</p>
                <p className="text-[10px] text-slate-500 font-medium truncate capitalize">{user?.role || 'Operator'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
`;

// 4. StatCard.jsx (Lucide React icon support, no emojis!)
const statCardCode = `import React from 'react';

const PALETTES = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', iconBg: 'bg-blue-600 text-white' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', iconBg: 'bg-indigo-600 text-white' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', iconBg: 'bg-purple-600 text-white' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', iconBg: 'bg-emerald-600 text-white' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', iconBg: 'bg-amber-600 text-white' },
  yellow: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', iconBg: 'bg-amber-600 text-white' },
  red: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', iconBg: 'bg-rose-600 text-white' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', iconBg: 'bg-slate-700 text-white' },
};

function StatCard({ label, value, icon: IconComponent, trend, color = 'blue', helper }) {
  const p = PALETTES[color] || PALETTES.blue;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
          {label}
        </p>
        {IconComponent && (
          <div className={\`w-7 h-7 rounded-md flex items-center justify-center shrink-0 \${p.bg} \${p.text}\`}>
            {typeof IconComponent === 'function' ? (
              <IconComponent size={15} />
            ) : (
              <span className="text-xs">{IconComponent}</span>
            )}
          </div>
        )}
      </div>

      <div className="mt-2">
        <p className="text-xl font-bold text-slate-900 tracking-tight">
          {value ?? 0}
        </p>

        {(trend || helper) && (
          <p className="text-[10.5px] font-medium text-slate-500 mt-1 truncate">
            {trend && <span className="font-semibold text-slate-700 mr-1">{trend}</span>}
            {helper}
          </p>
        )}
      </div>
    </div>
  );
}

export default StatCard;
`;

// 5. StatusBadge.jsx
const statusBadgeCode = `import React from 'react';

const STATUS_MAP = {
  // Production
  Planned: 'bg-slate-100 text-slate-700 border-slate-200',
  Scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
  'In Production': 'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Delayed: 'bg-rose-50 text-rose-700 border-rose-200',
  Cancelled: 'bg-slate-100 text-slate-500 border-slate-200',

  // Master Status
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-slate-100 text-slate-500 border-slate-200',

  // Inventory Stock
  Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'In Stock': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Low Stock': 'bg-amber-50 text-amber-700 border-amber-200',
  'Out of Stock': 'bg-rose-50 text-rose-700 border-rose-200',

  // Priority
  Low: 'bg-slate-100 text-slate-600 border-slate-200',
  Medium: 'bg-blue-50 text-blue-700 border-blue-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Urgent: 'bg-rose-50 text-rose-700 border-rose-200',

  // Demands
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-blue-50 text-blue-700 border-blue-200',
  Fulfilled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',

  // Alerts
  Critical: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
  Warning: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
  Info: 'bg-blue-50 text-blue-700 border-blue-200',

  // Txn types
  IN: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
  OUT: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
  ADJUSTMENT: 'bg-purple-50 text-purple-700 border-purple-200 font-bold',
};

function StatusBadge({ value, status }) {
  const text = value || status;
  if (!text) return null;
  const style = STATUS_MAP[text] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={\`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap \${style}\`}>
      {text}
    </span>
  );
}

export default StatusBadge;
`;

fs.writeFileSync(clientBase + '/index.css', cssCode, 'utf8');
fs.writeFileSync(clientBase + '/components/common/Header.jsx', headerCode, 'utf8');
fs.writeFileSync(clientBase + '/components/common/Sidebar.jsx', sidebarCode, 'utf8');
fs.writeFileSync(clientBase + '/components/common/StatCard.jsx', statCardCode, 'utf8');
fs.writeFileSync(clientBase + '/components/common/StatusBadge.jsx', statusBadgeCode, 'utf8');

console.log('Successfully written refined index.css, Header, Sidebar, StatCard, StatusBadge');

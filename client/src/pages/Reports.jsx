import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LabelList,
} from 'recharts';
import {
  Package, TrendingUp, CalendarDays, Wheat, AlertTriangle,
  RefreshCw, CheckCircle2, Clock, XCircle, Activity,
  BarChart2, PieChart as PieIcon, List, ArrowUpRight,
} from 'lucide-react';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

/* ── Design tokens used in charts ── */
const C = {
  primary: '#15803D',
  primaryDark: '#166534',
  green:   '#16A34A',
  gold:    '#EAB308',
  yellow:  '#D97706',
  red:     '#DC2626',
  charcoal:'#17251B',
  gray:    '#6B7280',
  orange:  '#D97706',
  blue:    '#15803D', // aliases old blue to primary green
  indigo:  '#166534',
  purple:  '#EAB308',
};

const TOOLTIP_STYLE = {
  backgroundColor: '#17251B',
  border: '1px solid #2d4533',
  borderRadius: 10,
  color: '#f1f5f9',
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
};

/* Status colours for pie slices */
const STATUS_COLORS = {
  Planned:       C.gray,
  Scheduled:     C.gold,
  'In Progress': C.yellow,
  Completed:     C.green,
  Delayed:       C.red,
  Cancelled:     C.gray,
  Available:     C.green,
  'Low Stock':   C.yellow,
  'Out of Stock': C.red,
  Pending:       C.yellow,
  Approved:      C.primary,
  'In Production': C.gold,
  Fulfilled:     C.green,
  Rejected:      C.red,
};

const PRIORITY_COLORS = { Low: C.gray, Medium: C.primary, High: C.yellow, Urgent: C.red };

/* ── Helper: compact breakdown bar ── */
function BreakdownBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{count} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div className="progress-wrap" style={{ height: 6 }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: color || C.blue, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

/* ── Helper: section card wrapper ── */
function SectionCard({ title, subtitle, icon: Icon, iconColor, children, style }) {
  return (
    <div className="card" style={style}>
      <div className="card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {Icon && (
              <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: iconColor ? `${iconColor}18` : 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor || 'var(--primary)', flexShrink: 0 }}>
                <Icon size={15} />
              </div>
            )}
            <div className="card-title">{title}</div>
          </div>
          {subtitle && <div className="card-subtitle" style={{ marginTop: 3 }}>{subtitle}</div>}
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

/* ── Custom Pie label ── */
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
function Reports() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchReport = useCallback(async (key, endpoint) => {
    setLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await api.get(`/reports/${endpoint}`);
      if (res.data.success) {
        setData((prev) => ({ ...prev, [key]: res.data.data }));
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to load ${key} report`);
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  }, []);

  const fetchAll = useCallback(() => {
    setError('');
    setData({});
    fetchReport('summary', 'summary');
    fetchReport('production', 'production');
    fetchReport('inventory', 'inventory');
    fetchReport('demand', 'demands');
  }, [fetchReport]);

  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const isAnyLoading = Object.values(loading).some(Boolean);
  const { summary, production, inventory, demand } = data;

  /* ── Derived data for charts ── */
  // Production status pie
  const prodStatusPie = production
    ? Object.entries(production.byStatus)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  // Inventory status pie
  const invStatusPie = inventory
    ? Object.entries(inventory.byStatus)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  // Demand status bar data
  const demandStatusBar = demand
    ? Object.entries(demand.byStatus).map(([name, value]) => ({ name, value }))
    : [];

  // Demand priority breakdown
  const demandPriorityBar = demand
    ? Object.entries(demand.byPriority).map(([name, value]) => ({ name, value }))
    : [];

  // Top 10 materials by stock
  const topMaterials = inventory
    ? [...inventory.materials]
        .sort((a, b) => b.currentStock - a.currentStock)
        .slice(0, 8)
        .map((m) => ({ name: m.materialName.length > 14 ? m.materialName.slice(0, 13) + '…' : m.materialName, stock: m.currentStock, reorder: m.reorderLevel }))
    : [];

  // Low stock materials for insights
  const lowStockItems = inventory
    ? inventory.materials.filter((m) => m.status === 'Low Stock' || m.status === 'Out of Stock')
    : [];

  // Pending demands
  const pendingDemands = demand
    ? demand.demands.filter((d) => d.status === 'Pending' || d.status === 'Approved').slice(0, 5)
    : [];

  // Recent transactions
  const recentTxns = inventory ? inventory.transactions.slice(0, 6) : [];

  /* ── Spinner placeholder ── */
  const SpinBlock = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, gap: 10, color: 'var(--text-muted)' }}>
      <div className="spinner spinner-primary" style={{ width: 18, height: 18, borderWidth: 2 }} />
      <span style={{ fontSize: 13 }}>Loading…</span>
    </div>
  );

  return (
    <div>
      {/* ══ Page Header ══ */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">Analytics &amp; Reports</h1>
          <p className="page-header-desc">Monitor production performance, demand trends, inventory health, and operational insights.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => setRefreshKey((k) => k + 1)} disabled={isAnyLoading}>
            <RefreshCw size={14} style={isAnyLoading ? { animation: 'spin 0.7s linear infinite' } : {}} />
            Refresh
          </button>
        </div>
      </div>

      {/* ══ Global Error ══ */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <AlertTriangle size={15} />
          <span>{error}</span>
          <button className="btn btn-sm" style={{ marginLeft: 'auto', padding: '4px 10px', background: 'var(--danger-50)', color: 'var(--danger)', border: '1px solid var(--danger-light)' }} onClick={() => setRefreshKey((k) => k + 1)}>
            Retry
          </button>
        </div>
      )}

      {/* ══ KPI Summary Cards ══ */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 24 }}>
        <StatCard
          label="Total Products"
          value={summary ? summary.products : '—'}
          icon={<Package size={22} />}
          color="blue"
          trend="Registered products"
        />
        <StatCard
          label="Total Demands"
          value={summary ? summary.demands : '—'}
          icon={<TrendingUp size={22} />}
          color="purple"
          trend="Customer demand orders"
        />
        <StatCard
          label="Production Plans"
          value={summary ? summary.productionPlans : '—'}
          icon={<CalendarDays size={22} />}
          color="yellow"
          trend="All plans"
        />
        <StatCard
          label="Raw Materials"
          value={summary ? summary.rawMaterials : '—'}
          icon={<Wheat size={22} />}
          color="green"
          trend="Registered materials"
        />
        <StatCard
          label="Avg. Progress"
          value={summary ? `${summary.avgCompletionRate}%` : '—'}
          icon={<Activity size={22} />}
          color="indigo"
          trend="Across all production orders"
        />
      </div>

      {/* ══ ROW 1: Production Status + Inventory Status ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Production Status Pie */}
        <SectionCard title="Production Plan Status" subtitle="Distribution of plans by current status" icon={PieIcon} iconColor={C.blue}>
          {loading.production ? <SpinBlock /> : production ? (
            <>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={prodStatusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" labelLine={false} label={PieLabel}>
                      {prodStatusPie.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || C.gray} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: 12 }}>
                {Object.entries(production.byStatus).map(([label, count]) => (
                  <BreakdownBar key={label} label={label} count={count} total={production.totalPlans} color={STATUS_COLORS[label]} />
                ))}
              </div>
            </>
          ) : <SpinBlock />}
        </SectionCard>

        {/* Inventory Status Pie */}
        <SectionCard title="Inventory Stock Health" subtitle="Raw material availability overview" icon={PieIcon} iconColor={C.green}>
          {loading.inventory ? <SpinBlock /> : inventory ? (
            <>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={invStatusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" labelLine={false} label={PieLabel}>
                      {invStatusPie.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || C.gray} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Available', color: C.green, count: inventory.byStatus['Available'] || 0 },
                  { label: 'Low Stock', color: C.yellow, count: inventory.byStatus['Low Stock'] || 0 },
                  { label: 'Out of Stock', color: C.red, count: inventory.byStatus['Out of Stock'] || 0 },
                ].map(({ label, color, count }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 'var(--radius)', background: `${color}12`, border: `1px solid ${color}30` }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color }}>{count}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Total Stock Value</span>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--success)' }}>{formatCurrency ? formatCurrency(inventory.totalValue) : `₹${inventory.totalValue.toLocaleString()}`}</span>
              </div>
            </>
          ) : <SpinBlock />}
        </SectionCard>
      </div>

      {/* ══ ROW 2: Demand Status + Priority Bar Charts ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        <SectionCard title="Demand by Status" subtitle="Order pipeline breakdown" icon={BarChart2} iconColor={C.purple}>
          {loading.demand ? <SpinBlock /> : demand ? (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={demandStatusBar} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(21,128,61,0.08)' }} />
                  <Bar dataKey="value" name="Demands" radius={[4, 4, 0, 0]}>
                    {demandStatusBar.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || C.primary} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <SpinBlock />}
        </SectionCard>

        <SectionCard title="Demand by Priority" subtitle="Urgency distribution of demand orders" icon={BarChart2} iconColor={C.gold}>
          {loading.demand ? <SpinBlock /> : demand ? (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={demandPriorityBar} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(21,128,61,0.08)' }} />
                  <Bar dataKey="value" name="Demands" radius={[4, 4, 0, 0]}>
                    {demandPriorityBar.map((entry) => (
                      <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || C.primary} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <SpinBlock />}
        </SectionCard>
      </div>

      {/* ══ ROW 3: Top Materials Stock Bar Chart ══ */}
      <SectionCard title="Top Materials — Stock vs Reorder Level" subtitle="Current stock compared to reorder threshold (top 8 by quantity)" icon={BarChart2} iconColor={C.green} style={{ marginBottom: 20 }}>
        {loading.inventory ? <SpinBlock /> : inventory && topMaterials.length > 0 ? (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={topMaterials} margin={{ top: 4, right: 16, left: 0, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={48} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(21,128,61,0.08)' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
                <Bar dataKey="stock" name="Current Stock" fill={C.primary} radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="reorder" name="Reorder Level" fill={C.gold} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : !loading.inventory ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>No material data available.</div>
        ) : <SpinBlock />}
      </SectionCard>

      {/* ══ ROW 4: Production Summary + Inventory Summary ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Production Summary */}
        <SectionCard title="Production Summary" subtitle="Overall production performance metrics" icon={CheckCircle2} iconColor={C.green}>
          {loading.production ? <SpinBlock /> : production ? (
            <div>
              {[
                { label: 'Total Production Plans', value: production.totalPlans, color: C.blue },
                { label: 'Total Planned Quantity', value: production.totalPlanned, color: C.purple },
                { label: 'Total Completed Quantity', value: production.totalCompleted, color: C.green },
                { label: 'Completion Rate', value: `${production.completionRate}%`, color: production.completionRate >= 75 ? C.green : production.completionRate >= 40 ? C.yellow : C.red },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Overall Completion</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{production.completionRate}%</span>
                </div>
                <div className="progress-wrap" style={{ height: 8 }}>
                  <div style={{
                    width: `${production.completionRate}%`, height: '100%', borderRadius: 999,
                    background: production.completionRate >= 75 ? C.green : production.completionRate >= 40 ? C.yellow : C.red,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            </div>
          ) : <SpinBlock />}
        </SectionCard>

        {/* Inventory Summary */}
        <SectionCard title="Inventory Summary" subtitle="Raw material stock health snapshot" icon={Wheat} iconColor={C.green}>
          {loading.inventory ? <SpinBlock /> : inventory ? (
            <div>
              {[
                { label: 'Total Materials', value: inventory.totalMaterials, color: C.blue },
                { label: 'Available', value: inventory.byStatus['Available'] || 0, color: C.green },
                { label: 'Low Stock', value: inventory.byStatus['Low Stock'] || 0, color: C.yellow },
                { label: 'Out of Stock', value: inventory.byStatus['Out of Stock'] || 0, color: C.red },
                { label: 'Total Stock Value', value: formatCurrency ? formatCurrency(inventory.totalValue) : `₹${inventory.totalValue.toLocaleString()}`, color: C.green },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color }}>{value}</span>
                </div>
              ))}
            </div>
          ) : <SpinBlock />}
        </SectionCard>
      </div>

      {/* ══ ROW 5: Operational Insights ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Low-stock materials */}
        <SectionCard title="Attention Required — Low &amp; Out-of-Stock Materials" subtitle="Materials needing restocking action" icon={AlertTriangle} iconColor={C.red}>
          {loading.inventory ? <SpinBlock /> : lowStockItems.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 8, color: 'var(--text-muted)' }}>
              <CheckCircle2 size={28} style={{ color: C.green }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>All materials adequately stocked</span>
            </div>
          ) : (
            <div>
              {lowStockItems.map((m) => (
                <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', marginBottom: 6, borderRadius: 'var(--radius)', background: m.status === 'Out of Stock' ? 'var(--danger-50)' : 'var(--warning-50)', border: `1px solid ${m.status === 'Out of Stock' ? 'var(--danger-light)' : 'var(--warning-light)'}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.materialName}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>Stock: {m.currentStock} {m.unit} · Reorder: {m.reorderLevel} {m.unit}</div>
                  </div>
                  <StatusBadge value={m.status} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Pending demands */}
        <SectionCard title="Open Demands" subtitle="Pending and approved demand orders" icon={Clock} iconColor={C.yellow}>
          {loading.demand ? <SpinBlock /> : pendingDemands.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 8, color: 'var(--text-muted)' }}>
              <CheckCircle2 size={28} style={{ color: C.green }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>No open demands</span>
            </div>
          ) : (
            <div>
              {pendingDemands.map((d) => (
                <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{d.productId?.productName || '—'}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>
                      <code style={{ fontSize: 10.5, color: 'var(--primary)', background: 'var(--primary-50)', padding: '1px 5px', borderRadius: 'var(--radius-xs)' }}>{d.demandId}</code>
                      {' · '}{d.customerName}{' · Qty: '}<strong>{d.quantity}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <StatusBadge value={d.priority} />
                    <StatusBadge value={d.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ══ ROW 6: Recent Production Plans + Recent Inventory Transactions ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 8 }}>

        {/* Recent Production Plans */}
        <SectionCard title="Recent Production Plans" subtitle="Latest production plan entries" icon={List} iconColor={C.blue}>
          {loading.production ? <SpinBlock /> : production && production.plans.length > 0 ? (
            <div className="table-wrap" style={{ borderRadius: 'var(--radius)', boxShadow: 'none', border: '1px solid var(--border-light)' }}>
              <table className="data-table" style={{ fontSize: 12.5 }}>
                <thead>
                  <tr>
                    <th>Plan ID</th>
                    <th>Product</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {production.plans.slice(0, 6).map((p) => (
                    <tr key={p._id}>
                      <td><code style={{ fontSize: 10.5, color: 'var(--primary)', background: 'var(--primary-50)', padding: '2px 5px', borderRadius: 'var(--radius-xs)', fontWeight: 600 }}>{p.planId}</code></td>
                      <td style={{ fontWeight: 600 }}>{p.productId?.productName || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{p.plannedQuantity}</td>
                      <td><StatusBadge value={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !loading.production ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: 13 }}>No production plans available.</div>
          ) : <SpinBlock />}
        </SectionCard>

        {/* Recent Inventory Transactions */}
        <SectionCard title="Recent Inventory Transactions" subtitle="Latest stock movements" icon={ArrowUpRight} iconColor={C.purple}>
          {loading.inventory ? <SpinBlock /> : recentTxns.length > 0 ? (
            <div className="table-wrap" style={{ borderRadius: 'var(--radius)', boxShadow: 'none', border: '1px solid var(--border-light)' }}>
              <table className="data-table" style={{ fontSize: 12.5 }}>
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTxns.map((t) => {
                    const TXN_BADGE = { IN: 'badge-green', OUT: 'badge-yellow', ADJUSTMENT: 'badge-purple' };
                    return (
                      <tr key={t._id}>
                        <td style={{ fontWeight: 600 }}>{t.materialId?.materialName || '—'}</td>
                        <td><span className={`badge ${TXN_BADGE[t.transactionType] || 'badge-gray'}`}>{t.transactionType}</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{t.quantity} {t.materialId?.unit || ''}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>{formatDate ? formatDate(t.transactionDate) : t.transactionDate?.slice(0, 10)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : !loading.inventory ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: 13 }}>No recent transactions.</div>
          ) : <SpinBlock />}
        </SectionCard>
      </div>

    </div>
  );
}

export default Reports;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Package, TrendingUp, CalendarDays, Wheat,
  AlertTriangle, Bell, ArrowRight, RefreshCw,
  CheckCircle2, Clock, ShieldCheck,
} from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#17251B',
  border: '1px solid #2d4533',
  borderRadius: '10px',
  color: '#f1f5f9',
  fontSize: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
};

const PROD_OVERVIEW_COLORS = {
  Planned: '#6366f1',
  Scheduled: '#3b82f6',
  'In Progress': '#d97706',
  Completed: '#16a34a',
  Delayed: '#dc2626',
  Cancelled: '#9ca3af',
};

const INVENTORY_PIE_COLORS = {
  Available: '#16a34a',
  'Low Stock': '#d97706',
  'Out of Stock': '#dc2626',
};

function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardAPI.getAdmin();
      if (res.data.success) {
        setData(res.data.data || res.data);
      }
    } catch (err) {
      // Fallback to general dashboard if admin route not accessible
      try {
        const fallbackRes = await dashboardAPI.get();
        if (fallbackRes.data.success) {
          setData(fallbackRes.data.data || fallbackRes.data);
        }
      } catch (fallbackErr) {
        setError(err.response?.data?.message || fallbackErr.response?.data?.message || 'Failed to load Admin dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner spinner-primary" style={{ width: 38, height: 38, borderWidth: 3 }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Loading Admin Command Center...</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Aggregating system-wide manufacturing telemetry</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong>Failed to load Admin Dashboard</strong>
            <p style={{ marginTop: 2, fontSize: 12 }}>{error || 'No telemetry data available.'}</p>
          </div>
          <button onClick={fetchDashboard} className="btn btn-danger btn-sm">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, charts, recent } = data;
  const recentAlerts = recent?.alerts || data.alerts || [];
  const recentDemands = recent?.demands || data.demands || [];
  const recentProduction = recent?.production || data.production || [];
  const lowStockMaterials = recent?.lowStockMaterials || data.inventory || [];

  return (
    <div>
      {/* Hero Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #17251B 0%, #1c3b24 50%, #15803D 100%)',
          borderRadius: '16px',
          padding: '26px 30px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'white',
          boxShadow: '0 8px 32px rgba(21, 128, 61, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(4px)', marginBottom: 8 }}>
            <ShieldCheck size={14} color="#86efac" />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#dcfce7' }}>
              Admin Command Center
            </span>
          </div>
          <h1 style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Welcome, {user?.name || user?.username || 'Administrator'}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 400 }}>
            Role: <strong style={{ color: '#fef08a' }}>{user?.role || 'Admin'}</strong> · Full system visibility and governance across all operations
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
          <button
            onClick={fetchDashboard}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 14px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 8,
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.15s',
            }}
          >
            <RefreshCw size={14} /> Refresh Live Data
          </button>
        </div>
      </div>

      {/* 8 Admin KPI Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <StatCard label="Total Products" value={stats?.totalProducts ?? 0} icon={<Package size={22} />} color="green" />
        <StatCard label="Total Demands" value={stats?.totalDemands ?? 0} icon={<TrendingUp size={22} />} color="gold" />
        <StatCard
          label="Pending Demands"
          value={stats?.pendingDemands ?? 0}
          icon={<Clock size={22} />}
          color="yellow"
          trend={stats?.pendingDemands > 0 ? '⚠ Awaiting approval' : '✓ Cleared'}
        />
        <StatCard label="Active Production Plans" value={stats?.activePlans ?? 0} icon={<CalendarDays size={22} />} color="green" />
        <StatCard label="Total Raw Materials" value={stats?.totalMaterials ?? 0} icon={<Wheat size={22} />} color="green" />
        <StatCard
          label="Low Stock Materials"
          value={stats?.lowStockMaterials ?? 0}
          icon={<AlertTriangle size={22} />}
          color="yellow"
          trend={stats?.lowStockMaterials > 0 ? '⚠ Restock required' : '✓ Healthy'}
        />
        <StatCard
          label="Production Progress"
          value={`${stats?.productionCompletion ?? 0}%`}
          icon={<CheckCircle2 size={22} />}
          color="green"
        />
        <StatCard
          label="Active Alerts"
          value={stats?.pendingAlerts ?? 0}
          icon={<Bell size={22} />}
          color="red"
          trend={stats?.pendingAlerts > 0 ? '⚠ Action required' : '✓ Normal'}
        />
      </div>

      {/* 4 Core Charts */}
      <div className="charts-grid" style={{ marginBottom: 24 }}>
        {/* Demand Overview */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Demand Overview</div>
            <div className="chart-card-subtitle">Customer demand vs planned production volume by product</div>
          </div>
          <div style={{ height: 240 }}>
            {charts?.demandVsProduction?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.demandVsProduction} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="demand" name="Customer Demand" fill="#EAB308" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="production" name="Production Plan" fill="#15803D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                No demand data available
              </div>
            )}
          </div>
        </div>

        {/* Production Overview / Status */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Production Status & Overview</div>
            <div className="chart-card-subtitle">Distribution of production batches across operational stages</div>
          </div>
          <div style={{ height: 240 }}>
            {charts?.productionOverview?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.productionOverview} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="count" name="Batches" radius={[4, 4, 0, 0]}>
                    {charts.productionOverview.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PROD_OVERVIEW_COLORS[entry.name] || entry.color || '#15803D'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                No production plans recorded
              </div>
            )}
          </div>
        </div>

        {/* Inventory Overview */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Inventory Overview</div>
            <div className="chart-card-subtitle">Raw materials breakdown by stock health</div>
          </div>
          <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {charts?.inventoryStatus?.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.inventoryStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={4}
                  >
                    {charts.inventoryStatus.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={INVENTORY_PIE_COLORS[entry.name] || entry.color || '#9ca3af'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No inventory data available</div>
            )}
          </div>
        </div>

        {/* Production Progress */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Production Progress</div>
            <div className="chart-card-subtitle">Completion percentage across active manufacturing runs</div>
          </div>
          <div style={{ height: 240 }}>
            {charts?.productionProgress?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={charts.productionProgress}
                  layout="vertical"
                  margin={{ top: 8, right: 30, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} unit="%" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} width={100} />
                  <Tooltip formatter={(val) => [`${val}%`, 'Progress']} contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="progress" fill="#15803D" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                No active progress batches recorded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feeds Grid */}
      <div className="feed-grid">
        {/* Critical Alerts */}
        <div className="feed-card">
          <div className="feed-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={16} style={{ color: 'var(--warning)' }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>System Alerts</span>
            </div>
            <Link to="/alerts" style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {recentAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-muted)' }}>
              ✓ All alerts cleared
            </div>
          ) : (
            <div>
              {recentAlerts.slice(0, 4).map((a) => (
                <div key={a._id} className="feed-item">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>{a.title}</p>
                    <StatusBadge status={a.severity} />
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Demands */}
        <div className="feed-card">
          <div className="feed-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} style={{ color: 'var(--purple)' }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Recent Demands</span>
            </div>
            <Link to="/demands" style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {recentDemands.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-muted)' }}>
              No customer orders recorded
            </div>
          ) : (
            <div>
              {recentDemands.slice(0, 4).map((d) => (
                <div key={d._id} className="feed-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{d.customerName}</p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                      {d.productId?.productName} · {d.quantity} units
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Production Runs */}
        <div className="feed-card">
          <div className="feed-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarDays size={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Active Production</span>
            </div>
            <Link to="/production" style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {recentProduction.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-muted)' }}>
              No active production plans
            </div>
          ) : (
            <div>
              {recentProduction.slice(0, 4).map((p) => (
                <div key={p._id} className="feed-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {p.productId?.productName || p.planId}
                    </p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                      Planned Qty: {p.plannedQuantity} {p.productId?.unit || 'units'}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Wheat, Boxes, AlertTriangle, ArrowDownRight, ArrowUpRight,
  RefreshCw, ArrowRight, Layers,
  PackageX, ShieldAlert, Maximize2, ChevronRight,
} from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import DataTableModal from '../../components/common/DataTableModal';
import LowStockTable from './components/LowStockTable';
import RecentTransactionsTable from './components/RecentTransactionsTable';

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#17251B',
  border: '1px solid #2d4533',
  borderRadius: '10px',
  color: '#f1f5f9',
  fontSize: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
};

const INVENTORY_PIE_COLORS = {
  Available: '#16a34a',
  'Low Stock': '#d97706',
  'Out of Stock': '#dc2626',
};

function InventoryDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal open states
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);

  // Trigger refs for focus restoration
  const lowStockModalTriggerRef = useRef(null);
  const transactionsModalTriggerRef = useRef(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardAPI.getInventory();
      if (res.data.success) {
        setData(res.data.data || res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Inventory dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Memoized low stock metrics for compact card
  const lowStockMetrics = useMemo(() => {
    const low = data?.lowStockMaterials || [];
    const out = data?.outOfStockMaterials || [];
    const all = [...out, ...low];
    return {
      totalAlerts: all.length,
      outOfStockCount: out.length,
      lowStockCount: low.length,
      topItems: all.slice(0, 3),
    };
  }, [data?.lowStockMaterials, data?.outOfStockMaterials]);

  // Memoized recent transactions metrics for compact card
  const txnMetrics = useMemo(() => {
    const txns = data?.recentTransactions || [];
    let inCount = 0;
    let outCount = 0;
    txns.forEach((t) => {
      if (t.transactionType === 'IN') inCount++;
      if (t.transactionType === 'OUT') outCount++;
    });
    return {
      total: txns.length,
      inCount,
      outCount,
      adjustmentCount: txns.length - inCount - outCount,
      recentItems: txns.slice(0, 3),
    };
  }, [data?.recentTransactions]);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner spinner-primary" style={{ width: 38, height: 38, borderWidth: 3 }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Loading Inventory Intelligence...</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Checking stock levels, reorder thresholds, and ledger history</p>
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
            <strong>Failed to load Inventory Dashboard</strong>
            <p style={{ marginTop: 2, fontSize: 12 }}>{error || 'No inventory telemetry available.'}</p>
          </div>
          <button onClick={fetchDashboard} className="btn btn-danger btn-sm">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    stats,
    lowStockMaterials = [],
    outOfStockMaterials = [],
    recentTransactions = [],
    materialUsage = [],
    reorderAlerts = [],
    inVsOutSummary = {},
    charts = {},
  } = data;

  const allLowStockItems = [...outOfStockMaterials, ...lowStockMaterials];

  return (
    <div>
      {/* Inventory Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #17251B 0%, #204026 50%, #15803D 100%)',
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
            <Boxes size={14} color="#86efac" />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#dcfce7' }}>
              Inventory Management Dashboard
            </span>
          </div>
          <h1 style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Welcome, {user?.name || user?.username || 'Inventory Manager'}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 400 }}>
            Role: <strong style={{ color: '#fef08a' }}>{user?.role || 'Inventory Manager'}</strong> · Raw materials oversight, stock replenishment, and transaction ledgers
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
          <Link
            to="/inventory"
            className="btn btn-primary"
            style={{
              background: '#EAB308',
              color: '#17251B',
              border: 'none',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Boxes size={15} /> Log Transaction
          </Link>
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
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Inventory Manager 6 KPI Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <StatCard
          label="Total Raw Materials"
          value={stats?.totalMaterials ?? 0}
          icon={<Wheat size={22} />}
          color="green"
          trend="Tracked stock items"
        />
        <StatCard
          label="Low Stock Materials"
          value={stats?.lowStockMaterials ?? 0}
          icon={<AlertTriangle size={22} />}
          color="yellow"
          trend={stats?.lowStockMaterials > 0 ? '⚠ Stock <= Reorder level' : '✓ Above reorder level'}
        />
        <StatCard
          label="Out of Stock Materials"
          value={stats?.outOfStockMaterials ?? 0}
          icon={<PackageX size={22} />}
          color={stats?.outOfStockMaterials > 0 ? 'red' : 'green'}
          trend={stats?.outOfStockMaterials > 0 ? '🚨 Immediate reorder needed' : '✓ Zero stockouts'}
        />
        <StatCard
          label="Total Inventory Quantity"
          value={stats?.totalInventoryQuantity?.toLocaleString() ?? 0}
          icon={<Layers size={22} />}
          color="gold"
          trend="Total units across warehouse"
        />
        <StatCard
          label="Inventory Transactions"
          value={stats?.totalTransactions ?? 0}
          icon={<Boxes size={22} />}
          color="green"
          trend="Total ledger receipts & dispatches"
        />
        <StatCard
          label="Reorder Required"
          value={stats?.reorderRequired ?? 0}
          icon={<ShieldAlert size={22} />}
          color={stats?.reorderRequired > 0 ? 'red' : 'green'}
          trend={stats?.reorderRequired > 0 ? '⚠ Purchase orders needed' : '✓ Stock adequate'}
        />
      </div>

      {/* Out of Stock Warning Banner (if any) */}
      {outOfStockMaterials.length > 0 && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#dc2626', color: 'white', padding: 8, borderRadius: 8, display: 'flex' }}>
              <PackageX size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#991b1b', margin: 0 }}>
                Critical: {outOfStockMaterials.length} Raw Material(s) Completely Out of Stock
              </h4>
              <p style={{ fontSize: 12, color: '#b91c1c', margin: '2px 0 0 0' }}>
                {outOfStockMaterials.map((m) => `${m.materialName} (${m.materialId})`).join(', ')} require emergency supplier orders.
              </p>
            </div>
          </div>
          <Link to="/inventory" className="btn btn-danger btn-sm" style={{ flexShrink: 0 }}>
            Receive Stock (IN)
          </Link>
        </div>
      )}

      {/* 2 Compact Summary Cards (Replacing inline congested tables) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Compact Card 1: Low & Reorder Stock */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ padding: '16px 20px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={17} color="#d97706" />
                  Low & Reorder Stock
                </span>
                {lowStockMetrics.totalAlerts > 0 ? (
                  <span className="badge badge-yellow">
                    {lowStockMetrics.totalAlerts} items need attention
                  </span>
                ) : (
                  <span className="badge badge-green">All Healthy</span>
                )}
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                Materials below their reorder level or completely out of stock.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button
                ref={lowStockModalTriggerRef}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsLowStockModalOpen(true)}
                aria-label="View full Low Stock table"
                title="Open full data table modal"
                style={{ padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Maximize2 size={13} />
                <span>View Details</span>
              </button>

              <Link
                to="/raw-materials"
                className="btn btn-primary btn-sm"
                style={{ padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <span>Materials</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* 3 Headline Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Out of Stock
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
                  {lowStockMetrics.outOfStockCount}
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#991b1b', marginLeft: 4 }}>items</span>
                </div>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Low Stock
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#d97706', marginTop: 4 }}>
                  {lowStockMetrics.lowStockCount}
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#92400e', marginLeft: 4 }}>items</span>
                </div>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Healthy
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#15803D', marginTop: 4 }}>
                  {(stats?.totalMaterials || 0) - lowStockMetrics.totalAlerts}
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#166534', marginLeft: 4 }}>items</span>
                </div>
              </div>
            </div>

            {/* Quick preview of top low stock items */}
            {lowStockMetrics.topItems.length > 0 ? (
              <div style={{ background: '#fafaf9', borderRadius: 8, padding: '10px 12px', border: '1px solid #f0f0ee' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>
                  Most Urgent:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lowStockMetrics.topItems.map((mat) => (
                    <div
                      key={mat._id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        padding: '4px 0',
                        gap: 10,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                          {mat.materialName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {mat.materialId} · Stock: {mat.currentStock} {mat.unit} | Reorder: {mat.reorderLevel} {mat.unit}
                        </div>
                      </div>
                      <StatusBadge status={mat.currentStock <= 0 ? 'Out of Stock' : 'Low Stock'} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px', fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                ✓ All raw materials are above reorder level!
              </div>
            )}
          </div>
        </div>

        {/* Compact Card 2: Recent Transactions */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ padding: '16px 20px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Boxes size={17} color="var(--primary)" />
                  Recent Transactions
                </span>
                <span className="badge badge-blue">
                  {txnMetrics.total} Entries
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                Latest stock movements: receipts, dispatches, and adjustments.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button
                ref={transactionsModalTriggerRef}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsTransactionsModalOpen(true)}
                aria-label="View full Recent Transactions table"
                title="Open full data table modal"
                style={{ padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Maximize2 size={13} />
                <span>View Details</span>
              </button>

              <Link
                to="/inventory"
                className="btn btn-sm"
                style={{
                  padding: '5px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'var(--gray-100)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                <span>Full Ledger</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Transaction Type Summary Chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>Received (IN)</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#16a34a', marginTop: 2 }}>
                  {txnMetrics.inCount}
                </div>
              </div>

              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Dispatched (OUT)</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#dc2626', marginTop: 2 }}>
                  {txnMetrics.outCount}
                </div>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#92400e', textTransform: 'uppercase' }}>Adjustments</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#d97706', marginTop: 2 }}>
                  {txnMetrics.adjustmentCount}
                </div>
              </div>
            </div>

            {/* Recent items preview */}
            {txnMetrics.recentItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {txnMetrics.recentItems.map((txn) => {
                  const isIN = txn.transactionType === 'IN';
                  const isOUT = txn.transactionType === 'OUT';
                  return (
                    <div
                      key={txn._id}
                      style={{
                        background: '#fafaf9',
                        borderRadius: 8,
                        padding: '8px 12px',
                        border: '1px solid #f0f0ee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          className="badge"
                          style={{
                            background: isIN ? '#dcfce7' : isOUT ? '#fee2e2' : '#fef3c7',
                            color: isIN ? '#166534' : isOUT ? '#991b1b' : '#92400e',
                            fontSize: 10.5,
                            fontWeight: 700,
                          }}
                        >
                          {txn.transactionType}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {txn.materialId?.materialName || 'Material'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: isIN ? '#16a34a' : isOUT ? '#dc2626' : '#d97706' }}>
                          {isIN ? '+' : isOUT ? '-' : ''}{txn.quantity} {txn.materialId?.unit || 'units'}
                        </span>
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                          {new Date(txn.transactionDate || txn.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px', fontSize: 12, color: 'var(--text-muted)' }}>
                No inventory movements recorded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid" style={{ marginBottom: 24 }}>
        {/* Chart 1: Raw Material Stock Levels vs Reorder Level */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Raw Material Stock vs Reorder Level</div>
            <div className="chart-card-subtitle">Current stock vs minimum safety reorder threshold</div>
          </div>
          <div style={{ height: 260 }}>
            {charts?.stockLevels?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.stockLevels} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="currentStock" name="Current Stock" fill="#15803D" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reorderLevel" name="Reorder Level" fill="#EAB308" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                No material stock data available
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Inventory Breakdown by Health */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Stock Health & Distribution</div>
            <div className="chart-card-subtitle">Materials categorized by availability and restock urgency</div>
          </div>
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {charts?.inventoryStatus?.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.inventoryStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {charts.inventoryStatus.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={INVENTORY_PIE_COLORS[entry.name] || '#9ca3af'} />
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
      </div>

      {/* Transaction & Movement Metrics Summary */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, background: 'linear-gradient(to right, #f8fafc, #f1f5f9)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#dcfce7', color: '#15803D', padding: 10, borderRadius: 10 }}>
              <ArrowDownRight size={20} />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Total Stock Inflow (IN)</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#166534' }}>+{inVsOutSummary?.totalIn?.toLocaleString() || 0} units</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: 10, borderRadius: 10 }}>
              <ArrowUpRight size={20} />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Total Stock Outflow (OUT)</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#991b1b' }}>-{inVsOutSummary?.totalOut?.toLocaleString() || 0} units</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#fef3c7', color: '#d97706', padding: 10, borderRadius: 10 }}>
              <Boxes size={20} />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Adjustments / Net Movement</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#92400e' }}>
                {inVsOutSummary?.netStockChange >= 0 ? `+${inVsOutSummary?.netStockChange}` : inVsOutSummary?.netStockChange || 0} units
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Material Usage & Reorder Alerts */}
      <div className="feed-grid">
        {/* Material Usage Summary */}
        <div className="feed-card">
          <div className="feed-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wheat size={16} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Top Consumed Materials</span>
            </div>
            <Link to="/reports" style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Analytics <ArrowRight size={12} />
            </Link>
          </div>
          {materialUsage.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-muted)' }}>
              No material consumption recorded yet
            </div>
          ) : (
            <div>
              {materialUsage.slice(0, 4).map((m) => (
                <div key={m.materialId} className="feed-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{m.materialName}</p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                      Stock: {m.currentStock} {m.unit} · Unit Cost: ${m.unitCost}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#dc2626' }}>
                      -{m.consumedQuantity} {m.unit}
                    </span>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Consumed</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reorder Alerts */}
        <div className="feed-card">
          <div className="feed-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color="var(--warning)" />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Reorder & Low Stock Alerts</span>
            </div>
            <Link to="/alerts" style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {reorderAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-muted)' }}>
              ✓ No stock alerts active
            </div>
          ) : (
            <div>
              {reorderAlerts.slice(0, 4).map((a) => (
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
      </div>

      {/* ================= MODAL 1: Full Low & Reorder Stock Table ================= */}
      <DataTableModal
        isOpen={isLowStockModalOpen}
        onClose={() => setIsLowStockModalOpen(false)}
        title="Low & Reorder Stock Materials"
        subtitle="Detailed list of raw materials below their reorder threshold or completely out of stock"
        badge={lowStockMetrics.totalAlerts > 0 ? `${lowStockMetrics.totalAlerts} Requiring Reorder` : 'All Healthy'}
        triggerRef={lowStockModalTriggerRef}
        headerAction={
          <Link
            to="/inventory"
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <ArrowDownRight size={13} /> Receive Stock
          </Link>
        }
      >
        <LowStockTable materials={allLowStockItems} />
      </DataTableModal>

      {/* ================= MODAL 2: Full Recent Transactions Table ================= */}
      <DataTableModal
        isOpen={isTransactionsModalOpen}
        onClose={() => setIsTransactionsModalOpen(false)}
        title="Recent Inventory Transactions"
        subtitle="Complete ledger of stock receipts, dispatches, and adjustments"
        badge={`${recentTransactions.length} Entries`}
        triggerRef={transactionsModalTriggerRef}
        headerAction={
          <Link
            to="/inventory"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Open Full Ledger <ChevronRight size={13} />
          </Link>
        }
      >
        <RecentTransactionsTable transactions={recentTransactions} />
      </DataTableModal>
    </div>
  );
}

export default InventoryDashboard;

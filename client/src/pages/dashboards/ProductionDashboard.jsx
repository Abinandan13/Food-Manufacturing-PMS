import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  CalendarDays, TrendingUp, Clock, AlertTriangle,
  CheckCircle2, RefreshCw, ArrowRight, Activity,
  Layers, Plus, PlayCircle, Flame, Maximize2,
  Package, ChevronRight, BarChart2, Info,
} from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import ProgressBar from '../../components/common/ProgressBar';
import DataTableModal from '../../components/common/DataTableModal';
import DemandStockTable from './components/DemandStockTable';
import UpcomingBatchesTable from './components/UpcomingBatchesTable';

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#17251B',
  border: '1px solid #2d4533',
  borderRadius: '10px',
  color: '#f1f5f9',
  fontSize: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
};

const PROD_STATUS_COLORS = {
  Planned: '#6366f1',
  Scheduled: '#3b82f6',
  'In Progress': '#d97706',
  Completed: '#16a34a',
  Delayed: '#dc2626',
  Cancelled: '#9ca3af',
};

function ProductionDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal open states
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [isBatchesModalOpen, setIsBatchesModalOpen] = useState(false);
  const [showCalcPopover, setShowCalcPopover] = useState(false);

  // Trigger refs for focus restoration
  const demandModalTriggerRef = useRef(null);
  const batchesModalTriggerRef = useRef(null);
  const calcPopoverRef = useRef(null);

  // Close popover on outside click
  useEffect(() => {
    if (!showCalcPopover) return;
    const handleClick = (e) => {
      if (calcPopoverRef.current && !calcPopoverRef.current.contains(e.target)) {
        setShowCalcPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCalcPopover]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardAPI.getProduction();
      if (res.data.success) {
        setData(res.data.data || res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Production dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Memoized calculations for Demand vs Stock Gap
  const demandMetrics = useMemo(() => {
    const list = data?.productsRequiringProduction || [];
    const needProd = list.filter((p) => p.suggestedProduction > 0);
    const totalSuggested = needProd.reduce((sum, p) => sum + (p.suggestedProduction || 0), 0);
    const stockOptimal = list.filter((p) => p.suggestedProduction === 0).length;

    return {
      needProductionCount: needProd.length,
      totalSuggestedQty: totalSuggested,
      stockOptimalCount: stockOptimal,
      topNeeding: needProd.slice(0, 3),
    };
  }, [data?.productsRequiringProduction]);

  // Memoized summary for Upcoming Batches
  const batchesSummary = useMemo(() => {
    const plans = data?.upcomingPlans || [];
    const counts = {
      Planned: 0,
      Scheduled: 0,
      'In Progress': 0,
      Completed: 0,
    };
    plans.forEach((p) => {
      if (counts[p.status] !== undefined) {
        counts[p.status]++;
      }
    });

    return {
      total: plans.length,
      counts,
      nextBatches: plans.slice(0, 3),
    };
  }, [data?.upcomingPlans]);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner spinner-primary" style={{ width: 38, height: 38, borderWidth: 3 }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Loading Production Intelligence...</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Fetching schedules, batches, and progress trackers</p>
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
            <strong>Failed to load Production Dashboard</strong>
            <p style={{ marginTop: 2, fontSize: 12 }}>{error || 'No production telemetry available.'}</p>
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
    upcomingPlans = [],
    pendingDemands = [],
    progressRecords = [],
    productsRequiringProduction = [],
    alerts = [],
    charts = {},
  } = data;

  return (
    <div>
      {/* Production Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #17251B 0%, #1f4227 50%, #15803D 100%)',
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
            <Activity size={14} color="#86efac" />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#dcfce7' }}>
              Production Management Dashboard
            </span>
          </div>
          <h1 style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Welcome, {user?.name || user?.username || 'Production Manager'}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 400 }}>
            Role: <strong style={{ color: '#fef08a' }}>{user?.role || 'Production Manager'}</strong> · Scheduling, batch execution, and manufacturing progress
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
          <Link
            to="/production"
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
            <CalendarDays size={15} /> Manage Plans
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

      {/* Production Manager 6 KPI Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <StatCard
          label="Pending Demands"
          value={stats?.pendingDemands ?? 0}
          icon={<Clock size={22} />}
          color="yellow"
          trend={stats?.pendingDemands > 0 ? '⚠ Awaiting batch scheduling' : '✓ All scheduled'}
        />
        <StatCard
          label="Active Production Plans"
          value={stats?.activePlans ?? 0}
          icon={<CalendarDays size={22} />}
          color="green"
          trend="In queue & on floor"
        />
        <StatCard
          label="Planned Production Qty"
          value={stats?.plannedQuantity?.toLocaleString() ?? 0}
          icon={<Layers size={22} />}
          color="gold"
          trend="Total units scheduled"
        />
        <StatCard
          label="Completed Production Qty"
          value={stats?.completedQuantity?.toLocaleString() ?? 0}
          icon={<CheckCircle2 size={22} />}
          color="green"
          trend="Finished goods output"
        />
        <StatCard
          label="Production Progress"
          value={`${stats?.productionProgress ?? 0}%`}
          icon={<Activity size={22} />}
          color="green"
          trend="Overall completion rate"
        />
        <StatCard
          label="Delayed / Incomplete"
          value={stats?.delayedOrIncomplete ?? 0}
          icon={<AlertTriangle size={22} />}
          color={stats?.delayedOrIncomplete > 0 ? 'red' : 'green'}
          trend={stats?.delayedOrIncomplete > 0 ? '⚠ Requires attention' : '✓ Running smoothly'}
        />
      </div>

      {/* 2 Compact Summary Cards (Replacing inline congested tables) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Compact Card 1: Products Requiring Production (Demand vs Stock Gap) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ padding: '16px 20px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Flame size={17} color="#d97706" />
                  Products Requiring Production
                </span>
                {demandMetrics.needProductionCount > 0 ? (
                  <span className="badge badge-yellow">
                    {demandMetrics.needProductionCount} need production
                  </span>
                ) : (
                  <span className="badge badge-green">Stock Optimal</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0 }}>
                  Products with more customer orders than ready stock. Make the quantity shown.
                </p>
                <div style={{ position: 'relative' }} ref={calcPopoverRef}>
                  <button
                    type="button"
                    onClick={() => setShowCalcPopover(!showCalcPopover)}
                    aria-label="How is this calculated?"
                    title="How is this calculated?"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 2, display: 'flex', alignItems: 'center',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Info size={14} />
                  </button>
                  {showCalcPopover && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginTop: 6,
                        width: 280,
                        background: '#17251B',
                        color: '#f1f5f9',
                        border: '1px solid #2d4533',
                        borderRadius: 10,
                        padding: '12px 14px',
                        fontSize: 12,
                        lineHeight: 1.6,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        zIndex: 100,
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 12.5 }}>How is this calculated?</div>
                      <p style={{ margin: 0, color: '#d1d5db' }}>
                        Orders 500 − Stock 0 = Make 500.<br />
                        If stock is enough, nothing to make.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button
                ref={demandModalTriggerRef}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsDemandModalOpen(true)}
                aria-label="View full Demand vs Stock table"
                title="Open full data table modal"
                style={{ padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Maximize2 size={13} />
                <span>View Details</span>
              </button>

              <Link
                to="/production"
                className="btn btn-primary btn-sm"
                style={{ padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <Plus size={13} />
                <span>Create Plan</span>
              </Link>
            </div>
          </div>

          <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* 3 Headline Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Needs Production
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#b45309', marginTop: 4 }}>
                  {demandMetrics.needProductionCount}
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#92400e', marginLeft: 4 }}>products</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Units To Make
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                  {demandMetrics.totalSuggestedQty.toLocaleString()}
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>total</span>
                </div>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Stock Optimal
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#15803D', marginTop: 4 }}>
                  {demandMetrics.stockOptimalCount}
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#166534', marginLeft: 4 }}>products</span>
                </div>
              </div>
            </div>

            {/* Quick preview of top products needing output */}
            {demandMetrics.topNeeding.length > 0 ? (
              <div style={{ background: '#fafaf9', borderRadius: 8, padding: '10px 12px', border: '1px solid #f0f0ee' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>
                  Top Priority:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {demandMetrics.topNeeding.map((item) => (
                    <div
                      key={item.productId}
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
                          {item.productName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {item.productCode} · Orders: {item.totalDemand} | In stock: {item.availableFinishedStock}
                        </div>
                      </div>
                      <span className="badge badge-yellow" style={{ fontSize: 11, flexShrink: 0, whiteSpace: 'nowrap' }}>
                        +{item.suggestedProduction} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px', fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                ✓ All products currently have enough stock!
              </div>
            )}
          </div>
        </div>

        {/* Compact Card 2: Upcoming Production Batches */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ padding: '16px 20px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CalendarDays size={17} color="var(--primary)" />
                  Upcoming Production Batches
                </span>
                <span className="badge badge-blue">
                  {batchesSummary.total} Batches
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                All production batches currently planned, scheduled, or in progress.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button
                ref={batchesModalTriggerRef}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsBatchesModalOpen(true)}
                aria-label="View full Upcoming Batches table"
                title="Open full data table modal"
                style={{ padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Maximize2 size={13} />
                <span>View Details</span>
              </button>

              <Link
                to="/production"
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
                <span>View All</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Status Summary Chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase' }}>Planned</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                  {batchesSummary.counts.Planned}
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase' }}>Scheduled</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                  {batchesSummary.counts.Scheduled}
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#d97706', textTransform: 'uppercase' }}>In Progress</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#d97706', marginTop: 2 }}>
                  {batchesSummary.counts['In Progress']}
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#16a34a', textTransform: 'uppercase' }}>Completed</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#16a34a', marginTop: 2 }}>
                  {batchesSummary.counts.Completed}
                </div>
              </div>
            </div>

            {/* Next 2-3 batches preview list */}
            {batchesSummary.nextBatches.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {batchesSummary.nextBatches.map((plan) => (
                  <div
                    key={plan._id}
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
                      <code style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primary)' }}>
                        {plan.planId}
                      </code>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {plan.productId?.productName || 'Batch'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {plan.plannedQuantity} {plan.productId?.unit}
                      </span>
                      <StatusBadge status={plan.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px', fontSize: 12, color: 'var(--text-muted)' }}>
                No active batches in queue
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid" style={{ marginBottom: 24 }}>
        {/* Planned vs Completed Production */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Planned vs Completed Output</div>
            <div className="chart-card-subtitle">Volume comparison of scheduled production vs actual completed goods</div>
          </div>
          <div style={{ height: 250 }}>
            {charts?.plannedVsCompleted?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.plannedVsCompleted} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="planned" name="Planned Output" fill="#EAB308" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed Units" fill="#15803D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                No production volume data available
              </div>
            )}
          </div>
        </div>

        {/* Production Status Overview */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-card-title">Production Status Distribution</div>
            <div className="chart-card-subtitle">Operational distribution across plan lifecycles</div>
          </div>
          <div style={{ height: 250 }}>
            {charts?.productionStatus?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.productionStatus} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="count" name="Plans Count" radius={[4, 4, 0, 0]}>
                    {charts.productionStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PROD_STATUS_COLORS[entry.name] || '#15803D'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                No status data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Split Grid: Live Batch Progress & Customer Demands to Schedule */}
      <div className="grid-2-1" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Live Manufacturing Progress Tracker */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PlayCircle size={16} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Live Batch Progress</span>
            </div>
            <Link to="/progress" style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Tracker <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ padding: '16px' }}>
            {progressRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                No active progress batches running
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {progressRecords.slice(0, 4).map((prog) => {
                  const pct = prog.progressPercentage || Math.min(100, Math.round(((prog.completedQuantity || 0) / (prog.plannedQuantity || 1)) * 100));
                  return (
                    <div key={prog._id} style={{ background: '#fafaf9', padding: '12px 14px', borderRadius: 8, border: '1px solid #f0f0ee' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {prog.productionPlanId?.productId?.productName || prog.progressId}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                            {prog.completedQuantity} / {prog.plannedQuantity} units
                          </span>
                        </div>
                        <StatusBadge status={prog.status} />
                      </div>
                      <ProgressBar value={pct} max={100} showPercent={true} height={6} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Customer Demands to Schedule */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="var(--purple)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Demands Awaiting Scheduling</span>
            </div>
            <Link to="/demands" style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ padding: '12px 16px' }}>
            {pendingDemands.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: 'var(--text-muted)' }}>
                ✓ All customer demands have been scheduled
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingDemands.slice(0, 4).map((d) => (
                  <div
                    key={d._id}
                    style={{
                      background: '#fafaf9',
                      borderRadius: 8,
                      padding: '10px 12px',
                      border: '1px solid #f0f0ee',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {d.customerName}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                        {d.productId?.productName} · <strong>{d.quantity}</strong> {d.productId?.unit || 'units'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <StatusBadge status={d.priority} />
                      <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                        Due: {new Date(d.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Production-related Alerts Feed */}
      {alerts.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color="var(--warning)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Production Alerts & Notifications</span>
            </div>
            <Link to="/reports" style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Analytics <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {alerts.slice(0, 3).map((a) => (
                <div key={a._id} className="feed-item" style={{ background: '#fafaf9', padding: '10px 12px', borderRadius: 8, border: '1px solid #f0f0ee' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', flex: 1, margin: 0 }}>
                      {a.title}
                    </p>
                    <StatusBadge status={a.severity} />
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, margin: '4px 0 0 0' }}>
                    {a.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: Full Demand vs Stock Gap Table ================= */}
      <DataTableModal
        isOpen={isDemandModalOpen}
        onClose={() => setIsDemandModalOpen(false)}
        title="Products Requiring Production (Demand vs Stock Gap)"
        subtitle="Detailed analysis of customer orders, finished stock on hand, and suggested production batches"
        badge={demandMetrics.needProductionCount > 0 ? `${demandMetrics.needProductionCount} Requiring Output` : 'Stock Optimal'}
        triggerRef={demandModalTriggerRef}
        headerAction={
          <Link
            to="/production"
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <Plus size={13} /> Create Plan
          </Link>
        }
      >
        <DemandStockTable products={productsRequiringProduction} />
      </DataTableModal>

      {/* ================= MODAL 2: Full Upcoming Batches Table ================= */}
      <DataTableModal
        isOpen={isBatchesModalOpen}
        onClose={() => setIsBatchesModalOpen(false)}
        title="Upcoming Production Batches"
        subtitle="Complete schedule of manufacturing batches, planned volumes, customer demand linkages, and timelines"
        badge={`${upcomingPlans.length} Total Batches`}
        triggerRef={batchesModalTriggerRef}
        headerAction={
          <Link
            to="/production"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Open Planning Page <ChevronRight size={13} />
          </Link>
        }
      >
        <UpcomingBatchesTable plans={upcomingPlans} />
      </DataTableModal>
    </div>
  );
}

export default ProductionDashboard;

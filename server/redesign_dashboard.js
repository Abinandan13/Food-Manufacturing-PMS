const fs = require('fs');

const dashboardPath = 'C:/Users/sabin/food-manufacturing-production/client/src/pages/Dashboard.jsx';

const dashboardCode = `import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Package,
  TrendingUp,
  Clock,
  CalendarDays,
  Wheat,
  AlertTriangle,
  CheckCircle2,
  Bell,
  ArrowRight,
  RefreshCw,
  Activity,
  Layers,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  Factory
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import { formatNumber, formatDate, timeAgo } from '../utils/formatters';

const INVENTORY_COLORS = {
  Available: '#10b981',
  'Low Stock': '#f59e0b',
  'Out of Stock': '#ef4444',
};

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard');
      if (res.data.success) {
        const payload = res.data.data || res.data;
        setData(payload);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect to manufacturing telemetry');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center min-h-[50vh] text-slate-400 gap-3 bg-white rounded-xl border border-slate-200">
        <RefreshCw size={26} className="animate-spin text-blue-700" />
        <p className="text-xs font-semibold text-slate-600">Connecting to manufacturing operational telemetry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center justify-between">
          <span>{error || 'No telemetry data received.'}</span>
          <button
            onClick={fetchDashboard}
            className="px-3 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { stats = {}, charts = {}, recent = {} } = data;
  const recentAlerts = recent?.alerts || data.alerts || [];
  const recentDemands = recent?.demands || data.demands || [];
  const recentProduction = recent?.production || data.production || [];

  // Grouped KPI stats
  const totalProducts = stats.totalProducts ?? 0;
  const totalDemands = stats.totalDemands ?? 0;
  const pendingDemands = stats.pendingDemands ?? 0;
  const activePlans = stats.activePlans ?? 0;
  const totalMaterials = stats.totalMaterials ?? 0;
  const lowStockMaterials = stats.lowStockMaterials ?? 0;
  const completionRate = stats.productionCompletion ?? 0;
  const pendingAlerts = stats.pendingAlerts ?? 0;

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Production Dashboard
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time manufacturing execution, customer order backlog, and ingredient stock control
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md shadow-2xs transition-colors"
          >
            <RefreshCw size={13} className="text-slate-500" />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. Structured KPI Section (Grouped visually: Orders/Runs & Materials/Health) */}
      <div className="space-y-3">
        {/* Row A: Orders & Production Execution */}
        <div>
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              Work Orders & Floor Execution
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* Total Demands */}
            <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Demands</span>
                <div className="w-7 h-7 rounded bg-blue-50 text-blue-700 flex items-center justify-center">
                  <TrendingUp size={15} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">{totalDemands}</p>
              <p className="text-[10.5px] text-slate-400 font-medium mt-1">Customer pipeline orders</p>
            </div>

            {/* Pending Demands */}
            <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Pending Approval</span>
                <div className="w-7 h-7 rounded bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Clock size={15} />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-1.5 tracking-tight">{pendingDemands}</p>
              <div className="mt-1">
                {pendingDemands > 0 ? (
                  <span className="inline-block text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    Awaiting Planning
                  </span>
                ) : (
                  <span className="text-[10.5px] text-slate-400 font-medium">All cleared</span>
                )}
              </div>
            </div>

            {/* Active Plans */}
            <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Active Run Plans</span>
                <div className="w-7 h-7 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Factory size={15} />
                </div>
              </div>
              <p className="text-2xl font-bold text-indigo-700 mt-1.5 tracking-tight">{activePlans}</p>
              <p className="text-[10.5px] text-slate-400 font-medium mt-1">Scheduled / In progress</p>
            </div>

            {/* Production Completion */}
            <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Output Efficiency</span>
                <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Activity size={15} />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-1.5 tracking-tight">{completionRate}%</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full"
                  style={{ width: \`\${Math.min(100, completionRate)}%\` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row B: Master Data, Inventory & Plant Safeguards */}
        <div>
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              Plant Inventory & Health Status
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* Total Products */}
            <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Active Products</span>
                <div className="w-7 h-7 rounded bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Package size={15} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">{totalProducts}</p>
              <p className="text-[10.5px] text-slate-400 font-medium mt-1">Catalog SKU lines</p>
            </div>

            {/* Total Raw Materials */}
            <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Raw Materials</span>
                <div className="w-7 h-7 rounded bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Wheat size={15} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">{totalMaterials}</p>
              <p className="text-[10.5px] text-slate-400 font-medium mt-1">Tracked ingredients</p>
            </div>

            {/* Low Stock Materials */}
            <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Low Stock Alert</span>
                <div className="w-7 h-7 rounded bg-rose-50 text-rose-700 flex items-center justify-center">
                  <AlertTriangle size={15} />
                </div>
              </div>
              <p className="text-2xl font-bold text-rose-600 mt-1.5 tracking-tight">{lowStockMaterials}</p>
              <div className="mt-1">
                {lowStockMaterials > 0 ? (
                  <span className="inline-block text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                    Reorder Required
                  </span>
                ) : (
                  <span className="text-[10.5px] text-emerald-600 font-semibold">Stock Optimal</span>
                )}
              </div>
            </div>

            {/* Pending Alerts */}
            <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">System Notices</span>
                <div className="w-7 h-7 rounded bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Bell size={15} />
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-700 mt-1.5 tracking-tight">{pendingAlerts}</p>
              <div className="mt-1">
                {pendingAlerts > 0 ? (
                  <Link to="/alerts" className="text-[10.5px] font-semibold text-blue-700 hover:underline">
                    View active alerts →
                  </Link>
                ) : (
                  <span className="text-[10.5px] text-slate-400 font-medium">All acknowledged</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Analytics Section: 4 Properly Sized & Titled Charts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
            Production & Supply Analytics
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart 1: Demand vs Production */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  1. Customer Demand vs. Planned Production
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Comparison across top manufactured SKUs
                </p>
              </div>
            </div>
            <div className="h-64 w-full pt-3">
              {charts?.demandVsProduction?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.demandVsProduction} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10.5, fill: '#64748b' }}
                      angle={-15}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis tick={{ fontSize: 10.5, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val, name) => [formatNumber(val), name === 'demand' ? 'Demand Required' : 'Planned Production']}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="demand" name="Demand Required" fill="#2563eb" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="production" name="Planned Output" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No demand vs production records recorded.
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Production Overview by Status */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  2. Production Batches by Status
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Batch volume across factory floor stages
                </p>
              </div>
            </div>
            <div className="h-64 w-full pt-3">
              {charts?.productionOverview?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.productionOverview} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10.5, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val, name, item) => [
                        \`\${val} batches (\${formatNumber(item.payload.quantity)} units)\`,
                        'Batches'
                      ]}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      {charts.productionOverview.map((entry, index) => (
                        <Cell key={\`cell-\${index}\`} fill={entry.color || '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No production overview data available.
                </div>
              )}
            </div>
          </div>

          {/* Chart 3: Raw Material Stock Health */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  3. Raw Material Stock Health
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Proportion of materials in stock vs threshold shortages
                </p>
              </div>
            </div>
            <div className="h-64 w-full pt-3 flex items-center justify-center">
              {charts?.inventoryStatus?.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.inventoryStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {charts.inventoryStatus.map((entry, idx) => (
                        <Cell key={\`pie-\${idx}\`} fill={entry.color || INVENTORY_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [\`\${val} materials\`, 'Count']}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">No inventory threshold data recorded.</div>
              )}
            </div>
          </div>

          {/* Chart 4: Active Run Completion Progress */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  4. Floor Production Completion (%)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Real-time manufacturing completion percentage across active batches
                </p>
              </div>
            </div>
            <div className="h-64 w-full pt-3">
              {charts?.productionProgress?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={charts.productionProgress}
                    layout="vertical"
                    margin={{ top: 10, right: 25, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10.5, fill: '#64748b' }} unit="%" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10.5, fill: '#64748b' }} width={100} />
                    <Tooltip
                      formatter={(val, _, item) => [
                        \`\${val}% (\${formatNumber(item.payload.completed)} / \${formatNumber(item.payload.planned)} units)\`,
                        'Completion'
                      ]}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="progress" fill="#059669" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No active progress batches on factory floor.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Critical Alerts Callout Section (Visually prominent without overpowering) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldAlert size={17} className="text-amber-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Active Plant Alerts & Warnings
            </h2>
            {pendingAlerts > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {pendingAlerts} Unread
              </span>
            )}
          </div>
          <Link
            to="/alerts"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline"
          >
            Manage All Alerts <ArrowRight size={12} />
          </Link>
        </div>

        {recentAlerts.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1" />
            All inventory levels, batches, and delivery deadlines are currently within normal parameters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 mt-1">
            {recentAlerts.slice(0, 3).map((a) => (
              <div key={a._id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{a.title || 'System Alert'}</p>
                      <StatusBadge value={a.severity || 'Critical'} />
                    </div>
                    <p className="text-slate-600 text-[11.5px] mt-0.5">{a.message}</p>
                  </div>
                </div>
                <span className="text-[10.5px] text-slate-400 font-medium whitespace-nowrap shrink-0">
                  {timeAgo(a.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Recent Activity Section: Two Balanced Columns (Demands & Plans) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Recent Customer Demands */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-700" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Recent Customer Demands
              </h2>
            </div>
            <Link
              to="/demands"
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
            >
              View All <ArrowUpRight size={12} />
            </Link>
          </div>

          {recentDemands.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No recent customer demands.
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase">
                    <th className="py-2.5 px-3.5">Customer</th>
                    <th className="py-2.5 px-3.5">Target Product</th>
                    <th className="py-2.5 px-3.5 text-right">Quantity</th>
                    <th className="py-2.5 px-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {recentDemands.slice(0, 5).map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3.5 font-bold text-slate-900">
                        {d.customerName}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 truncate max-w-[150px]">
                        {d.productId?.productName || 'Product'}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                        {formatNumber(d.quantity)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <StatusBadge value={d.status || 'Pending'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Active Production Plans */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-indigo-700" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Active Production Plans
              </h2>
            </div>
            <Link
              to="/production"
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
            >
              View All <ArrowUpRight size={12} />
            </Link>
          </div>

          {recentProduction.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No active production plans.
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase">
                    <th className="py-2.5 px-3.5">Plan Ref</th>
                    <th className="py-2.5 px-3.5">Product</th>
                    <th className="py-2.5 px-3.5 text-right">Batch Qty</th>
                    <th className="py-2.5 px-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {recentProduction.slice(0, 5).map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono font-bold text-blue-700">
                        {p.planNumber || \`PLAN-\${p._id.slice(-6).toUpperCase()}\`}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-800 font-medium truncate max-w-[150px]">
                        {p.productId?.productName || 'Product'}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                        {formatNumber(p.plannedQuantity)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <StatusBadge value={p.status || 'Planned'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
`;

fs.writeFileSync(dashboardPath, dashboardCode, 'utf8');
console.log('Successfully redesigned Dashboard.jsx as a professional command center');

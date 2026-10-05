import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  RotateCcw,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';
import { createResourceApi } from '../services/resource';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatCard from '../components/common/StatCard';
import { formatCurrency, formatDate } from '../utils/formatters';

const materialsApi = createResourceApi('/rawmaterials');
const inventoryApi = createResourceApi('/inventory');

const TXN_TYPES = ['IN', 'OUT', 'ADJUSTMENT'];
const MATERIAL_STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'In Stock', value: 'Available' },
  { label: 'Low Stock', value: 'Low Stock' },
  { label: 'Out of Stock', value: 'Out of Stock' },
];

const emptyMaterialForm = {
  materialName: '',
  category: '',
  unit: 'kg',
  currentStock: '',
  minimumStock: '',
  maximumStock: '',
  reorderLevel: '',
  supplier: '',
  unitCost: '',
};

const emptyTxnForm = {
  materialId: '',
  transactionType: 'IN',
  quantity: '',
  reference: '',
  remarks: '',
};

function RawMaterialsInventory() {
  const [tab, setTab] = useState('materials'); // 'materials' | 'transactions'

  // --- Materials state ---
  const [materials, setMaterials] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]); // unfiltered for accurate KPI stats
  const [matLoading, setMatLoading] = useState(true);
  const [matError, setMatError] = useState('');
  const [matSearch, setMatSearch] = useState('');
  const [matStatusFilter, setMatStatusFilter] = useState('');

  const [matModalOpen, setMatModalOpen] = useState(false);
  const [editingMatId, setEditingMatId] = useState(null);
  const [matForm, setMatForm] = useState(emptyMaterialForm);
  const [matSaving, setMatSaving] = useState(false);
  const [matFormError, setMatFormError] = useState('');
  const [deleteMatTarget, setDeleteMatTarget] = useState(null);

  // --- Transactions state ---
  const [transactions, setTransactions] = useState([]);
  const [txnLoading, setTxnLoading] = useState(true);
  const [txnError, setTxnError] = useState('');
  const [txnTypeFilter, setTxnTypeFilter] = useState('');

  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [txnForm, setTxnForm] = useState(emptyTxnForm);
  const [txnSaving, setTxnSaving] = useState(false);
  const [txnFormError, setTxnFormError] = useState('');

  // --- Fetch unfiltered materials for accurate KPI stats ---
  const fetchAllForKpis = useCallback(async () => {
    try {
      const res = await materialsApi.list();
      if (res && res.data) {
        setAllMaterials(res.data);
      }
    } catch {
      // Ignore background KPI load errors
    }
  }, []);

  // --- Fetch filtered materials for table ---
  const fetchMaterials = useCallback(async () => {
    setMatLoading(true);
    setMatError('');
    try {
      const params = {};
      if (matSearch.trim()) params.search = matSearch.trim();
      if (matStatusFilter) params.status = matStatusFilter;
      const json = await materialsApi.list(params);
      setMaterials(json.data || []);
      // If no active filters, also update the KPI baseline
      if (!matSearch && !matStatusFilter) {
        setAllMaterials(json.data || []);
      }
    } catch (err) {
      setMatError(err.response?.data?.message || 'Failed to load raw materials');
    } finally {
      setMatLoading(false);
    }
  }, [matSearch, matStatusFilter]);

  // --- Fetch transactions ---
  const fetchTransactions = useCallback(async () => {
    setTxnLoading(true);
    setTxnError('');
    try {
      const params = {};
      if (txnTypeFilter) params.transactionType = txnTypeFilter;
      const json = await inventoryApi.list(params);
      setTransactions(json.data || []);
    } catch (err) {
      setTxnError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setTxnLoading(false);
    }
  }, [txnTypeFilter]);

  // Initial load
  useEffect(() => {
    fetchAllForKpis();
  }, [fetchAllForKpis]);

  useEffect(() => {
    const t = setTimeout(fetchMaterials, 250);
    return () => clearTimeout(t);
  }, [fetchMaterials]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Refresh helper
  const handleRefresh = () => {
    fetchAllForKpis();
    fetchMaterials();
    fetchTransactions();
  };

  // --- Material CRUD handlers ---
  const openCreateMaterial = () => {
    setEditingMatId(null);
    setMatForm(emptyMaterialForm);
    setMatFormError('');
    setMatModalOpen(true);
  };

  const openEditMaterial = (m) => {
    setEditingMatId(m._id);
    setMatForm({
      materialName: m.materialName || '',
      category: m.category || '',
      unit: m.unit || 'kg',
      currentStock: m.currentStock ?? '',
      minimumStock: m.minimumStock ?? '',
      maximumStock: m.maximumStock ?? '',
      reorderLevel: m.reorderLevel ?? '',
      supplier: m.supplier || '',
      unitCost: m.unitCost ?? '',
    });
    setMatFormError('');
    setMatModalOpen(true);
  };

  const closeMaterialModal = () => {
    setMatModalOpen(false);
    setEditingMatId(null);
    setMatForm(emptyMaterialForm);
    setMatFormError('');
  };

  const handleMatChange = (e) => {
    const { name, value } = e.target;
    setMatForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMatSubmit = async (e) => {
    e.preventDefault();
    setMatFormError('');
    setMatSaving(true);
    try {
      const payload = {
        ...matForm,
        currentStock: Number(matForm.currentStock) || 0,
        minimumStock: Number(matForm.minimumStock) || 0,
        maximumStock: Number(matForm.maximumStock) || 0,
        reorderLevel: Number(matForm.reorderLevel) || 0,
        unitCost: Number(matForm.unitCost) || 0,
      };

      if (editingMatId) {
        await materialsApi.update(editingMatId, payload);
      } else {
        await materialsApi.create(payload);
      }

      closeMaterialModal();
      fetchAllForKpis();
      fetchMaterials();
    } catch (err) {
      setMatFormError(err.response?.data?.message || 'Save failed. Please check inputs.');
    } finally {
      setMatSaving(false);
    }
  };

  const confirmDeleteMaterial = async () => {
    if (!deleteMatTarget) return;
    try {
      await materialsApi.remove(deleteMatTarget._id);
      setDeleteMatTarget(null);
      fetchAllForKpis();
      fetchMaterials();
    } catch (err) {
      setMatError(err.response?.data?.message || 'Delete failed');
      setDeleteMatTarget(null);
    }
  };

  // --- Transaction handlers ---
  const openCreateTxn = () => {
    setTxnForm(emptyTxnForm);
    setTxnFormError('');
    setTxnModalOpen(true);
  };

  const closeTxnModal = () => {
    setTxnModalOpen(false);
    setTxnForm(emptyTxnForm);
    setTxnFormError('');
  };

  const handleTxnChange = (e) => {
    const { name, value } = e.target;
    setTxnForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTxnSubmit = async (e) => {
    e.preventDefault();
    setTxnFormError('');

    if (Number(txnForm.quantity) <= 0) {
      setTxnFormError('Quantity must be greater than 0.');
      return;
    }

    setTxnSaving(true);
    try {
      const payload = {
        ...txnForm,
        quantity: Number(txnForm.quantity),
      };
      await inventoryApi.create(payload);
      closeTxnModal();
      fetchTransactions();
      fetchAllForKpis();
      fetchMaterials(); // stock levels updated
    } catch (err) {
      setTxnFormError(err.response?.data?.message || 'Transaction failed');
    } finally {
      setTxnSaving(false);
    }
  };

  // --- KPI calculations ---
  const kpiSource = allMaterials.length > 0 ? allMaterials : materials;
  const totalCount = kpiSource.length;
  const inStockCount = kpiSource.filter(
    (m) => m.status === 'Available' || (!m.status && m.currentStock > (m.reorderLevel || 0))
  ).length;
  const lowStockCount = kpiSource.filter(
    (m) => m.status === 'Low Stock' || (!m.status && m.currentStock > 0 && m.currentStock <= (m.reorderLevel || 0))
  ).length;
  const outOfStockCount = kpiSource.filter(
    (m) => m.status === 'Out of Stock' || (!m.status && (m.currentStock || 0) <= 0)
  ).length;

  // Selected material info for modal editing display
  const editingMaterialObj = editingMatId ? materials.find((m) => m._id === editingMatId) : null;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">Raw Materials</h1>
          <p className="page-header-desc">
            Manage raw material stock, suppliers, costs, and reorder levels.
          </p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            title="Refresh materials and stock data"
          >
            <RefreshCw size={14} className={matLoading ? 'spin' : ''} />
            Refresh
          </button>
          {tab === 'materials' ? (
            <button className="btn btn-primary" onClick={openCreateMaterial}>
              <Plus size={14} />
              Add Material
            </button>
          ) : (
            <button className="btn btn-primary" onClick={openCreateTxn}>
              <Plus size={14} />
              New Transaction
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Total Materials"
          value={totalCount}
          icon={<Package size={22} />}
          color="blue"
          trend="Registered in catalog"
        />
        <StatCard
          label="In Stock"
          value={inStockCount}
          icon={<CheckCircle size={22} />}
          color="green"
          trend="Optimal inventory level"
        />
        <StatCard
          label="Low Stock"
          value={lowStockCount}
          icon={<AlertTriangle size={22} />}
          color="yellow"
          trend="At or below reorder point"
        />
        <StatCard
          label="Out of Stock"
          value={outOfStockCount}
          icon={<AlertCircle size={22} />}
          color="red"
          trend="Immediate attention needed"
        />
      </div>

      {/* View Switcher Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 20,
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: 8,
        }}
      >
        <button
          onClick={() => setTab('materials')}
          className={`btn btn-sm ${tab === 'materials' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 'var(--radius)' }}
        >
          <Package size={13} />
          Material Inventory ({materials.length})
        </button>
        <button
          onClick={() => setTab('transactions')}
          className={`btn btn-sm ${tab === 'transactions' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 'var(--radius)' }}
        >
          <SlidersHorizontal size={13} />
          Stock Movements ({transactions.length})
        </button>
      </div>

      {/* --- TAB 1: RAW MATERIALS --- */}
      {tab === 'materials' && (
        <>
          {/* Error Alert */}
          {matError && (
            <div className="alert alert-danger" style={{ marginBottom: 16 }}>
              <AlertCircle size={16} />
              <span>{matError}</span>
            </div>
          )}

          {/* Search & Filter Toolbar */}
          <div className="toolbar">
            <div className="toolbar-left" style={{ flexWrap: 'wrap' }}>
              {/* Search */}
              <div className="search-bar" style={{ minWidth: 260, maxWidth: 360, flex: 1 }}>
                <Search size={15} className="search-bar-icon" />
                <input
                  type="text"
                  placeholder="Search materials or suppliers..."
                  value={matSearch}
                  onChange={(e) => setMatSearch(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: 160 }}
                value={matStatusFilter}
                onChange={(e) => setMatStatusFilter(e.target.value)}
              >
                {MATERIAL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Clear Filters Button */}
              {(matSearch || matStatusFilter) && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setMatSearch('');
                    setMatStatusFilter('');
                  }}
                  title="Reset all filters"
                >
                  <RotateCcw size={13} />
                  Clear Filters
                </button>
              )}
            </div>

            <div className="toolbar-right">
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 500 }}>
                Showing <strong>{materials.length}</strong> of {totalCount} items
              </span>
            </div>
          </div>

          {/* Materials Table */}
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 180 }}>Material</th>
                  <th>Category</th>
                  <th style={{ minWidth: 180 }}>Stock Level</th>
                  <th>Reorder Level</th>
                  <th>Unit Cost</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', minWidth: 130 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <div
                          className="spinner spinner-primary"
                          style={{ width: 22, height: 22, borderWidth: 2.5 }}
                        />
                        <span style={{ fontSize: 13.5, fontWeight: 500 }}>Loading raw materials...</span>
                      </div>
                    </td>
                  </tr>
                ) : materials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="data-table-empty">
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '36px 16px',
                        }}
                      >
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: '50%',
                            background: 'var(--gray-100)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 12,
                            color: 'var(--text-muted)',
                          }}
                        >
                          <Package size={26} />
                        </div>
                        <h3
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: 0,
                          }}
                        >
                          No materials found
                        </h3>
                        <p
                          style={{
                            fontSize: 13,
                            color: 'var(--text-muted)',
                            marginTop: 6,
                            marginBottom: 16,
                            maxWidth: 380,
                            textAlign: 'center',
                          }}
                        >
                          {matSearch || matStatusFilter
                            ? 'No raw materials match your current search query or status filter.'
                            : 'No raw materials have been added yet. Click "Add Material" to record your first supply.'}
                        </p>
                        {matSearch || matStatusFilter ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setMatSearch('');
                              setMatStatusFilter('');
                            }}
                          >
                            <RotateCcw size={13} /> Clear Filters
                          </button>
                        ) : (
                          <button className="btn btn-primary btn-sm" onClick={openCreateMaterial}>
                            <Plus size={14} /> Add Material
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  materials.map((m) => {
                    // Calculate visual stock percentage
                    const maxCap =
                      m.maximumStock && m.maximumStock > 0
                        ? m.maximumStock
                        : m.reorderLevel && m.reorderLevel > 0
                        ? m.reorderLevel * 2
                        : Math.max(m.currentStock || 1, 100);

                    const stockPct = Math.min(
                      100,
                      Math.max(0, Math.round(((m.currentStock || 0) / maxCap) * 100))
                    );

                    const isOutOfStock =
                      m.status === 'Out of Stock' || (m.currentStock || 0) <= 0;
                    const isLowStock =
                      !isOutOfStock &&
                      (m.status === 'Low Stock' || (m.currentStock || 0) <= (m.reorderLevel || 0));

                    const barColor = isOutOfStock
                      ? 'var(--danger)'
                      : isLowStock
                      ? 'var(--warning)'
                      : 'var(--success)';

                    return (
                      <tr key={m._id}>
                        {/* Material Name & ID */}
                        <td>
                          <div
                            style={{
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              fontSize: 14,
                              letterSpacing: '-0.01em',
                            }}
                          >
                            {m.materialName}
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: 'var(--text-muted)',
                              fontFamily: 'monospace',
                              marginTop: 2,
                            }}
                          >
                            {m.materialId}
                          </div>
                        </td>

                        {/* Category */}
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--gray-100)',
                              color: 'var(--text-secondary)',
                              fontSize: 12,
                              fontWeight: 500,
                            }}
                          >
                            {m.category || 'General'}
                          </span>
                        </td>

                        {/* Stock with Progress Indicator */}
                        <td>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'baseline',
                              justifyContent: 'space-between',
                              marginBottom: 4,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                fontSize: 13.5,
                              }}
                            >
                              {m.currentStock?.toLocaleString('en-IN') ?? 0}{' '}
                              <span
                                style={{
                                  fontSize: 11.5,
                                  fontWeight: 500,
                                  color: 'var(--text-muted)',
                                }}
                              >
                                {m.unit}
                              </span>
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: barColor,
                              }}
                            >
                              {stockPct}%
                            </span>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: 6,
                              background: 'var(--gray-200)',
                              borderRadius: 3,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${stockPct}%`,
                                height: '100%',
                                background: barColor,
                                borderRadius: 3,
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                        </td>

                        {/* Reorder Level */}
                        <td>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {m.reorderLevel?.toLocaleString('en-IN') ?? 0} {m.unit}
                          </span>
                        </td>

                        {/* Unit Cost */}
                        <td>
                          <div
                            style={{
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              fontSize: 13,
                            }}
                          >
                            {formatCurrency(m.unitCost)}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            per {m.unit}
                          </div>
                        </td>

                        {/* Supplier */}
                        <td>
                          <span
                            style={{
                              fontSize: 13,
                              color: m.supplier ? 'var(--text-primary)' : 'var(--text-muted)',
                            }}
                          >
                            {m.supplier || '—'}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <StatusBadge value={m.status} />
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              justifyContent: 'flex-end',
                            }}
                          >
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditMaterial(m)}
                              title="Edit Material"
                              style={{ padding: '5px 9px', fontSize: 12 }}
                            >
                              <Edit2 size={12} />
                              <span>Edit</span>
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeleteMatTarget(m)}
                              title="Delete Material"
                              style={{ padding: '5px 8px' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* --- TAB 2: STOCK TRANSACTIONS --- */}
      {tab === 'transactions' && (
        <>
          {txnError && (
            <div className="alert alert-danger" style={{ marginBottom: 16 }}>
              <AlertCircle size={16} />
              <span>{txnError}</span>
            </div>
          )}

          <div className="toolbar">
            <div className="toolbar-left">
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: 160 }}
                value={txnTypeFilter}
                onChange={(e) => setTxnTypeFilter(e.target.value)}
              >
                <option value="">All Movement Types</option>
                {TXN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === 'IN' ? 'IN (Received)' : t === 'OUT' ? 'OUT (Consumed)' : 'ADJUSTMENT (Audit)'}
                  </option>
                ))}
              </select>

              {txnTypeFilter && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setTxnTypeFilter('')}
                >
                  <RotateCcw size={13} /> Reset Filter
                </button>
              )}
            </div>

            <div className="toolbar-right">
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 500 }}>
                {transactions.length} recorded movement{transactions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Inventory ID</th>
                  <th>Material</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {txnLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <div
                          className="spinner spinner-primary"
                          style={{ width: 22, height: 22, borderWidth: 2.5 }}
                        />
                        <span style={{ fontSize: 13.5, fontWeight: 500 }}>Loading transactions...</span>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="data-table-empty">
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '36px 16px',
                        }}
                      >
                        <SlidersHorizontal size={28} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          No transactions found
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, marginBottom: 16 }}>
                          No stock movements have been recorded yet.
                        </p>
                        <button className="btn btn-primary btn-sm" onClick={openCreateTxn}>
                          <Plus size={14} /> Record Transaction
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => {
                    const badgeClass =
                      t.transactionType === 'IN'
                        ? 'badge-green'
                        : t.transactionType === 'OUT'
                        ? 'badge-yellow'
                        : 'badge-purple';

                    const Icon =
                      t.transactionType === 'IN'
                        ? ArrowDownLeft
                        : t.transactionType === 'OUT'
                        ? ArrowUpRight
                        : SlidersHorizontal;

                    return (
                      <tr key={t._id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {t.inventoryId}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {t.materialId?.materialName || '—'}
                          </div>
                          {t.materialId?.materialId && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {t.materialId.materialId}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${badgeClass}`}>
                            <Icon size={11} />
                            {t.transactionType}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {t.transactionType === 'IN' ? '+' : t.transactionType === 'OUT' ? '−' : ''}
                            {t.quantity?.toLocaleString('en-IN')}{' '}
                            <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)' }}>
                              {t.materialId?.unit || ''}
                            </span>
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {t.reference || '—'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                            {formatDate(t.transactionDate)}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {t.remarks || '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* --- ADD / EDIT MATERIAL MODAL --- */}
      <Modal
        isOpen={matModalOpen}
        onClose={closeMaterialModal}
        title={editingMatId ? 'Edit Material' : 'New Material'}
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={closeMaterialModal}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="material-form"
              disabled={matSaving}
              className="btn btn-primary"
            >
              {matSaving
                ? 'Saving...'
                : editingMatId
                ? 'Update Material'
                : 'Save Material'}
            </button>
          </>
        }
      >
        {matFormError && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <AlertCircle size={15} />
            <span>{matFormError}</span>
          </div>
        )}

        <form id="material-form" onSubmit={handleMatSubmit}>
          {/* Two-Column Responsive Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '14px 18px',
            }}
          >
            {/* Material Name */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label form-label-required">Material Name</label>
              <input
                type="text"
                name="materialName"
                value={matForm.materialName}
                onChange={handleMatChange}
                placeholder="e.g. Wheat Flour Premium"
                required
                className="form-control"
              />
            </div>

            {/* Material Code */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Material Code</label>
              <input
                type="text"
                value={
                  editingMaterialObj?.materialId || 'Auto-generated on save (e.g. MAT001)'
                }
                disabled
                className="form-control"
                style={{
                  background: 'var(--gray-100)',
                  color: 'var(--text-muted)',
                  cursor: 'not-allowed',
                }}
              />
            </div>

            {/* Category */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category</label>
              <input
                type="text"
                name="category"
                value={matForm.category}
                onChange={handleMatChange}
                placeholder="e.g. Grains, Sweeteners, Dairy, Spices"
                className="form-control"
              />
            </div>

            {/* Unit */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Unit of Measure</label>
              <select
                name="unit"
                value={matForm.unit}
                onChange={handleMatChange}
                className="form-control"
              >
                <option value="kg">kg (Kilograms)</option>
                <option value="g">g (Grams)</option>
                <option value="liters">liters (Liters)</option>
                <option value="ml">ml (Milliliters)</option>
                <option value="units">units (Units / Pieces)</option>
                <option value="bags">bags (Bags)</option>
                <option value="boxes">boxes (Boxes)</option>
              </select>
            </div>

            {/* Current Stock */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label form-label-required">Current Stock</label>
              <input
                type="number"
                name="currentStock"
                value={matForm.currentStock}
                onChange={handleMatChange}
                min="0"
                step="any"
                placeholder="0"
                required
                className="form-control"
              />
            </div>

            {/* Reorder Level */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Reorder Level</label>
              <input
                type="number"
                name="reorderLevel"
                value={matForm.reorderLevel}
                onChange={handleMatChange}
                min="0"
                step="any"
                placeholder="Minimum threshold before alert"
                className="form-control"
              />
            </div>

            {/* Unit Cost */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Unit Cost (₹)</label>
              <input
                type="number"
                name="unitCost"
                value={matForm.unitCost}
                onChange={handleMatChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="form-control"
              />
            </div>

            {/* Supplier */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Supplier</label>
              <input
                type="text"
                name="supplier"
                value={matForm.supplier}
                onChange={handleMatChange}
                placeholder="e.g. Apex Agricultural Foods Ltd."
                className="form-control"
              />
            </div>

            {/* Minimum Stock */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Minimum Stock</label>
              <input
                type="number"
                name="minimumStock"
                value={matForm.minimumStock}
                onChange={handleMatChange}
                min="0"
                step="any"
                placeholder="0"
                className="form-control"
              />
            </div>

            {/* Maximum Stock */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Maximum Stock</label>
              <input
                type="number"
                name="maximumStock"
                value={matForm.maximumStock}
                onChange={handleMatChange}
                min="0"
                step="any"
                placeholder="Storage capacity limit"
                className="form-control"
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              padding: '10px 14px',
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-light)',
            }}
          >
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              ℹ️ <strong>Automatic Status Calculation:</strong> Material status (
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>Available</span>,{' '}
              <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Low Stock</span>, or{' '}
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Out of Stock</span>) is
              automatically calculated by the system based on Current Stock and Reorder Level.
            </p>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteMatTarget}
        title="Delete Raw Material"
        message={`Are you sure you want to delete "${deleteMatTarget?.materialName}" (${deleteMatTarget?.materialId})? This action cannot be undone.`}
        confirmLabel="Delete Material"
        onCancel={() => setDeleteMatTarget(null)}
        onConfirm={confirmDeleteMaterial}
        danger={true}
      />

      {/* --- NEW TRANSACTION MODAL --- */}
      <Modal
        isOpen={txnModalOpen}
        onClose={closeTxnModal}
        title="Record Stock Movement"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={closeTxnModal}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="txn-form"
              disabled={txnSaving}
              className="btn btn-primary"
            >
              {txnSaving ? 'Recording...' : 'Record Transaction'}
            </button>
          </>
        }
      >
        {txnFormError && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <AlertCircle size={15} />
            <span>{txnFormError}</span>
          </div>
        )}

        <form id="txn-form" onSubmit={handleTxnSubmit} className="space-y-3">
          <div className="form-group">
            <label className="form-label form-label-required">Raw Material</label>
            <select
              name="materialId"
              value={txnForm.materialId}
              onChange={handleTxnChange}
              required
              className="form-control"
            >
              <option value="">Select a raw material</option>
              {materials.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.materialName} ({m.materialId}) — Stock: {m.currentStock} {m.unit}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
            }}
          >
            <div className="form-group">
              <label className="form-label form-label-required">Movement Type</label>
              <select
                name="transactionType"
                value={txnForm.transactionType}
                onChange={handleTxnChange}
                className="form-control"
              >
                {TXN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === 'IN' ? 'IN (Receipt)' : t === 'OUT' ? 'OUT (Consumption)' : 'ADJUSTMENT (Audit Set)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">
                {txnForm.transactionType === 'ADJUSTMENT' ? 'New Stock Value' : 'Quantity'}
              </label>
              <input
                type="number"
                name="quantity"
                value={txnForm.quantity}
                onChange={handleTxnChange}
                min="0.001"
                step="any"
                required
                placeholder="0.00"
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reference / PO Number</label>
            <input
              type="text"
              name="reference"
              value={txnForm.reference}
              onChange={handleTxnChange}
              placeholder="e.g. PO-2026-0042, Batch-08B"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Remarks</label>
            <textarea
              name="remarks"
              value={txnForm.remarks}
              onChange={handleTxnChange}
              rows={2}
              placeholder="Optional notes regarding this inventory movement..."
              className="form-control"
            />
          </div>

          {txnForm.transactionType === 'ADJUSTMENT' && (
            <div
              style={{
                padding: '8px 12px',
                background: 'var(--warning-light)',
                borderRadius: 'var(--radius)',
                color: '#92400e',
                fontSize: 12,
              }}
            >
              ⚠️ <strong>Adjustment Note:</strong> Setting an adjustment directly overrides the current stock level to this exact value.
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

export default RawMaterialsInventory;

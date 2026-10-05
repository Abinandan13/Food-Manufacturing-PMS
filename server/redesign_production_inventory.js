const fs = require('fs');

const pagesDir = 'C:/Users/sabin/food-manufacturing-production/client/src/pages';

// 1. ProductionPlanning.jsx
const productionCode = `import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, CalendarDays, Factory, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { createResourceApi } from '../services/resource';
import api from '../services/api';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatDate, formatNumber } from '../utils/formatters';

const productionPlansApi = createResourceApi('/productionplans');

const STATUS_OPTIONS = ['Planned', 'Scheduled', 'In Progress', 'Completed', 'Delayed', 'Cancelled'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

const emptyForm = {
  productId: '',
  demandId: '',
  plannedQuantity: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  priority: 'Medium',
  status: 'Planned',
  notes: '',
};

function ProductionPlanning() {
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [calcHint, setCalcHint] = useState(null);

  const fetchDependencies = async () => {
    try {
      const [prodRes, demRes] = await Promise.all([
        api.get('/products'),
        api.get('/demands'),
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.data || []);
      if (demRes.data.success) setDemands(demRes.data.data || []);
    } catch (err) {
      console.error('Failed to load dependency data', err);
    }
  };

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const json = await productionPlansApi.list(params);
      setPlans(json.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load production plans');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchPlans, 300);
    return () => clearTimeout(t);
  }, [fetchPlans]);

  const handleDemandSelect = (demandId) => {
    const selectedDemand = demands.find((d) => d._id === demandId);
    if (selectedDemand) {
      const pId = selectedDemand.productId?._id || selectedDemand.productId;
      const demandQty = Number(selectedDemand.quantity) || 0;
      setForm((prev) => ({
        ...prev,
        demandId,
        productId: pId || prev.productId,
        plannedQuantity: prev.plannedQuantity || demandQty,
      }));
      setCalcHint({
        customer: selectedDemand.customerName,
        demandQty,
        hint: \`Demand: \${demandQty} units (Planned = Demand - Available Stock)\`,
      });
    } else {
      setForm((prev) => ({ ...prev, demandId }));
      setCalcHint(null);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setCalcHint(null);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingId(plan._id);
    setForm({
      productId: plan.productId?._id || plan.productId || '',
      demandId: plan.demandId?._id || plan.demandId || '',
      plannedQuantity: plan.plannedQuantity ?? '',
      startDate: plan.startDate ? new Date(plan.startDate).toISOString().slice(0, 10) : '',
      endDate: plan.endDate ? new Date(plan.endDate).toISOString().slice(0, 10) : '',
      priority: plan.priority || 'Medium',
      status: plan.status || 'Planned',
      notes: plan.notes || '',
    });
    setCalcHint(null);
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setCalcHint(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        plannedQuantity: Number(form.quantity || form.plannedQuantity),
      };

      if (editingId) {
        await productionPlansApi.update(editingId, payload);
      } else {
        await productionPlansApi.create(payload);
      }
      closeModal();
      fetchPlans();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save production plan');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await productionPlansApi.remove(deleteTarget._id);
      setDeleteTarget(null);
      fetchPlans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  const totalPlans = plans.length;
  const inProgressPlans = plans.filter((p) => p.status === 'In Progress').length;
  const plannedCount = plans.filter((p) => p.status === 'Planned' || p.status === 'Scheduled').length;
  const completedPlans = plans.filter((p) => p.status === 'Completed').length;

  const filteredPlans = plans.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const pName = (p.productId?.productName || '').toLowerCase();
    const planNo = (p.planNumber || '').toLowerCase();
    const customer = (p.demandId?.customerName || '').toLowerCase();
    return pName.includes(s) || planNo.includes(s) || customer.includes(s);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Factory size={20} className="text-blue-700" />
            Production Planning
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Planned Batch Quantity = Demand Quantity - Available Finished Stock
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary shadow-xs">
          <Plus size={15} /> Create Production Plan
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Batch Runs</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{totalPlans}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Scheduled / Planned</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{plannedCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Active on Line</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{inProgressPlans}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Completed Runs</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{completedPlans}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar-bar">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 outline-none transition-colors"
            placeholder="Search by plan #, product, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:bg-white"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-responsive">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <span className="spinner" />
            Loading production plans...
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Factory size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">No production plans found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Generate batch schedules from customer demands.</p>
          </div>
        ) : (
          <table className="ent-table">
            <thead>
              <tr>
                <th>Plan Reference</th>
                <th>Target Product</th>
                <th>Linked Demand</th>
                <th className="text-right">Planned Batch Qty</th>
                <th>Target Schedule</th>
                <th className="text-center">Priority</th>
                <th className="text-center">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((plan) => {
                const pName = plan.productId?.productName || products.find((p) => p._id === plan.productId)?.productName || 'Product';
                const custName = plan.demandId?.customerName || 'Direct Factory Run';
                return (
                  <tr key={plan._id}>
                    <td className="font-mono font-bold text-blue-700">
                      {plan.planNumber || \`PLAN-\${plan._id.slice(-6).toUpperCase()}\`}
                    </td>
                    <td className="font-bold text-slate-900">{pName}</td>
                    <td className="text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-slate-400" />
                        {custName}
                      </span>
                    </td>
                    <td className="text-right font-mono font-bold text-slate-900">
                      {formatNumber(plan.plannedQuantity || plan.quantity)} {plan.productId?.unit || 'units'}
                    </td>
                    <td className="text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs">
                        <span>{formatDate(plan.startDate)}</span>
                        <ArrowRight size={10} className="text-slate-400" />
                        <span>{formatDate(plan.endDate)}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <StatusBadge value={plan.priority || 'Medium'} />
                    </td>
                    <td className="text-center">
                      <StatusBadge value={plan.status || 'Planned'} />
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Plan"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(plan)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Plan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Production Plan' : 'Create Production Plan'}
        size="md"
        footer={
          <>
            <button type="button" onClick={closeModal} className="btn btn-secondary btn-sm" disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="plan-form" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Plan' : 'Create Plan'}
            </button>
          </>
        }
      >
        <form id="plan-form" onSubmit={handleSubmit} className="space-y-3 text-xs">
          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Link Customer Demand (Optional)</label>
            <select
              name="demandId"
              className="form-control"
              value={form.demandId}
              onChange={(e) => handleDemandSelect(e.target.value)}
            >
              <option value="">-- Direct Plant Run (No Linked Demand) --</option>
              {demands.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.customerName} - {d.productId?.productName} (Req: {d.quantity})
                </option>
              ))}
            </select>
            {calcHint && (
              <p className="text-[11px] text-blue-700 mt-1 font-medium bg-blue-50 p-2 rounded border border-blue-200">
                Formula applied: {calcHint.hint}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Target Product *</label>
              <select
                name="productId"
                className="form-control"
                value={form.productId}
                onChange={handleChange}
                required
              >
                <option value="">-- Choose Product --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>{p.productName} ({p.unit})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Planned Batch Quantity *</label>
              <input
                type="number"
                min="1"
                name="plannedQuantity"
                className="form-control"
                value={form.plannedQuantity}
                onChange={handleChange}
                placeholder="e.g. 500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Planned Start Date *</label>
              <input
                type="date"
                name="startDate"
                className="form-control"
                value={form.startDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Target Completion Date *</label>
              <input
                type="date"
                name="endDate"
                className="form-control"
                value={form.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                name="priority"
                className="form-control"
                value={form.priority}
                onChange={handleChange}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                className="form-control"
                value={form.status}
                onChange={handleChange}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Production Plan"
        message="Are you sure you want to delete this production plan? Floor operations will be notified."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        confirmLabel="Delete Plan"
        danger={true}
      />
    </div>
  );
}

export default ProductionPlanning;
`;

// 2. RawMaterialsInventory.jsx
const rawMaterialsCode = `import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Wheat, AlertTriangle, ArrowDownLeft, CheckCircle2 } from 'lucide-react';
import { createResourceApi } from '../services/resource';
import api from '../services/api';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ProgressBar from '../components/common/ProgressBar';
import { formatCurrency, formatNumber } from '../utils/formatters';

const materialsApi = createResourceApi('/rawmaterials');
const inventoryApi = createResourceApi('/inventory');

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

function RawMaterialsInventory() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyMaterialForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Quick Stock Adjustment
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustType, setAdjustType] = useState('IN');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustRemarks, setAdjustRemarks] = useState('');
  const [adjustSaving, setAdjustSaving] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const res = await materialsApi.list(params);
      setMaterials(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load raw materials');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    const t = setTimeout(fetchMaterials, 300);
    return () => clearTimeout(t);
  }, [fetchMaterials]);

  const categories = Array.from(new Set(materials.map((m) => m.category).filter(Boolean)));

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyMaterialForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (mat) => {
    setEditingId(mat._id);
    setForm({
      materialName: mat.materialName || '',
      category: mat.category || '',
      unit: mat.unit || 'kg',
      currentStock: mat.currentStock ?? '',
      minimumStock: mat.minimumStock ?? '',
      maximumStock: mat.maximumStock ?? '',
      reorderLevel: mat.reorderLevel ?? '',
      supplier: mat.supplier || '',
      unitCost: mat.unitCost ?? '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyMaterialForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        currentStock: form.currentStock === '' ? 0 : Number(form.currentStock),
        minimumStock: form.minimumStock === '' ? 0 : Number(form.minimumStock),
        maximumStock: form.maximumStock === '' ? 0 : Number(form.maximumStock),
        reorderLevel: form.reorderLevel === '' ? 0 : Number(form.reorderLevel),
        unitCost: form.unitCost === '' ? 0 : Number(form.unitCost),
      };

      if (editingId) {
        await materialsApi.update(editingId, payload);
      } else {
        await materialsApi.create(payload);
      }
      closeModal();
      fetchMaterials();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save raw material');
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustTarget || !adjustQty) return;
    setAdjustSaving(true);
    try {
      await inventoryApi.create({
        materialId: adjustTarget._id,
        transactionType: adjustType,
        quantity: Number(adjustQty),
        reference: \`ADJ-\${adjustType}\`,
        remarks: adjustRemarks || 'Quick floor adjustment',
      });
      setAdjustTarget(null);
      setAdjustQty('');
      setAdjustRemarks('');
      fetchMaterials();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record stock movement');
    } finally {
      setAdjustSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await materialsApi.remove(deleteTarget._id);
      setDeleteTarget(null);
      fetchMaterials();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete material');
    }
  };

  // KPIs
  const totalMaterials = materials.length;
  const lowStockItems = materials.filter((m) => (m.currentStock || 0) <= (m.minimumStock || 0));
  const outOfStockItems = materials.filter((m) => (m.currentStock || 0) <= 0);
  const healthyCount = totalMaterials - lowStockItems.length;

  const filteredMaterials = materials.filter((m) => {
    if (!stockStatusFilter) return true;
    const stock = m.currentStock || 0;
    const min = m.minimumStock || 0;
    if (stockStatusFilter === 'Out of Stock') return stock <= 0;
    if (stockStatusFilter === 'Low Stock') return stock > 0 && stock <= min;
    if (stockStatusFilter === 'In Stock') return stock > min;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wheat size={20} className="text-teal-700" />
            Raw Material Stock Control
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track ingredient reserves, minimum threshold reorder points, and supplier unit costs
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary shadow-xs">
          <Plus size={15} /> Add Raw Material
        </button>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span className="font-bold">
              {lowStockItems.length} Ingredient(s) at or below Minimum Reorder Level:
            </span>
            <span className="text-amber-800 hidden md:inline truncate max-w-md">
              {lowStockItems.map((m) => m.materialName).slice(0, 3).join(', ')}
              {lowStockItems.length > 3 ? \` + \${lowStockItems.length - 3} more\` : ''}
            </span>
          </div>
          <button
            onClick={() => setStockStatusFilter('Low Stock')}
            className="px-2 py-0.5 bg-amber-600 text-white font-semibold rounded text-[11px] hover:bg-amber-700 shrink-0 transition-colors"
          >
            Filter Shortages
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Ingredients</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{totalMaterials}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Stock Optimal</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{healthyCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Low Stock Reorders</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{lowStockItems.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Out of Stock (Zero)</p>
          <p className="text-xl font-bold text-rose-600 mt-1">{outOfStockItems.length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar-bar">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 outline-none transition-colors"
            placeholder="Search ingredient by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:bg-white"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:bg-white"
          value={stockStatusFilter}
          onChange={(e) => setStockStatusFilter(e.target.value)}
        >
          <option value="">All Stock Health</option>
          <option value="In Stock">In Stock (Normal)</option>
          <option value="Low Stock">Low Stock (≤ Reorder)</option>
          <option value="Out of Stock">Out of Stock (0)</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-responsive">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <span className="spinner" />
            Loading raw materials inventory...
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Wheat size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">No raw materials found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Register ingredients and packaging items above.</p>
          </div>
        ) : (
          <table className="ent-table">
            <thead>
              <tr>
                <th>Ingredient / Material</th>
                <th>Category</th>
                <th className="w-48">Stock Health vs Capacity</th>
                <th className="text-center">Min / Max Reorder</th>
                <th className="text-right">Unit Valuation</th>
                <th>Supplier</th>
                <th className="text-center">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((mat) => {
                const stock = mat.currentStock ?? 0;
                const min = mat.minimumStock ?? 0;
                const max = mat.maximumStock || (min * 3) || 100;
                const ratio = Math.min(100, Math.round((stock / max) * 100));

                let statusText = 'In Stock';
                if (stock <= 0) statusText = 'Out of Stock';
                else if (stock <= min) statusText = 'Low Stock';

                return (
                  <tr key={mat._id}>
                    <td className="font-bold text-slate-900">{mat.materialName}</td>
                    <td>
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {mat.category || 'General'}
                      </span>
                    </td>
                    <td>
                      <div className="w-44">
                        <div className="flex justify-between text-[11px] mb-1 font-semibold">
                          <span className={stock <= min ? 'text-rose-600 font-bold' : 'text-slate-900'}>
                            {formatNumber(stock)} {mat.unit}
                          </span>
                          <span className="text-slate-400 font-normal">{ratio}%</span>
                        </div>
                        <ProgressBar percent={ratio} showLabel={false} color={stock <= min ? 'red' : 'green'} />
                      </div>
                    </td>
                    <td className="text-center text-slate-600 font-mono text-[11.5px]">
                      {formatNumber(min)} / {formatNumber(max)} {mat.unit}
                    </td>
                    <td className="text-right font-mono font-bold text-slate-900">
                      {formatCurrency(mat.unitCost)} / {mat.unit}
                    </td>
                    <td className="text-slate-600">{mat.supplier || '—'}</td>
                    <td className="text-center">
                      <StatusBadge value={statusText} />
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setAdjustTarget(mat);
                            setAdjustType('IN');
                            setAdjustQty('');
                          }}
                          className="p-1 text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          title="Quick Stock Adjustment"
                        >
                          <ArrowDownLeft size={14} />
                        </button>
                        <button
                          onClick={() => openEditModal(mat)}
                          className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Material"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(mat)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Material"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Material Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Raw Material' : 'Add Raw Material'}
        size="md"
        footer={
          <>
            <button type="button" onClick={closeModal} className="btn btn-secondary btn-sm" disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="mat-form" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Material' : 'Add Material'}
            </button>
          </>
        }
      >
        <form id="mat-form" onSubmit={handleSubmit} className="space-y-3 text-xs">
          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Material / Ingredient Name *</label>
            <input
              type="text"
              name="materialName"
              className="form-control"
              value={form.materialName}
              onChange={handleChange}
              placeholder="e.g. Cane Sugar Crystal"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                name="category"
                className="form-control"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Sweeteners"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Measurement Unit *</label>
              <input
                type="text"
                name="unit"
                className="form-control"
                value={form.unit}
                onChange={handleChange}
                placeholder="kg, liters, grams"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="form-group">
              <label className="form-label">Current Stock</label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="currentStock"
                className="form-control"
                value={form.currentStock}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Min Stock (Reorder)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="minimumStock"
                className="form-control"
                value={form.minimumStock}
                onChange={handleChange}
                placeholder="50"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max Stock</label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="maximumStock"
                className="form-control"
                value={form.maximumStock}
                onChange={handleChange}
                placeholder="500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Unit Cost (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="unitCost"
                className="form-control"
                value={form.unitCost}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Supplier</label>
              <input
                type="text"
                name="supplier"
                className="form-control"
                value={form.supplier}
                onChange={handleChange}
                placeholder="e.g. Apex Agri Corp"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Quick Adjustment Modal */}
      <Modal
        isOpen={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        title={\`Stock Movement: \${adjustTarget?.materialName}\`}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setAdjustTarget(null)} className="btn btn-secondary btn-sm" disabled={adjustSaving}>
              Cancel
            </button>
            <button type="submit" form="adjust-form" className="btn btn-primary btn-sm" disabled={adjustSaving}>
              {adjustSaving ? 'Recording...' : 'Save Movement'}
            </button>
          </>
        }
      >
        <form id="adjust-form" onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-slate-500">Current Stock on Floor:</p>
            <p className="text-sm font-bold text-slate-900 font-mono">
              {formatNumber(adjustTarget?.currentStock)} {adjustTarget?.unit}
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Movement Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['IN', 'OUT', 'ADJUSTMENT'].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setAdjustType(type)}
                  className={\`py-1 rounded text-xs font-bold border transition-colors \${
                    adjustType === type
                      ? type === 'IN'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : type === 'OUT'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }\`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Quantity ({adjustTarget?.unit}) *</label>
            <input
              type="number"
              min="0.01"
              step="any"
              className="form-control"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              placeholder="e.g. 100"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Movement Notes / Reason</label>
            <input
              type="text"
              className="form-control"
              value={adjustRemarks}
              onChange={(e) => setAdjustRemarks(e.target.value)}
              placeholder="e.g. Received PO-889"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Raw Material"
        message={\`Are you sure you want to remove "\${deleteTarget?.materialName}"? Recipe BOM calculations will be impacted.\`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        confirmLabel="Delete Material"
        danger={true}
      />
    </div>
  );
}

export default RawMaterialsInventory;
`;

// 3. Inventory.jsx
const inventoryCode = `import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal, Plus, Search, Filter, RefreshCw, AlertCircle, Boxes, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import { formatDateTime, formatNumber } from '../utils/formatters';

const TXN_TYPES = ['IN', 'OUT', 'ADJUSTMENT'];

const emptyTxnForm = {
  materialId: '',
  transactionType: 'IN',
  quantity: '',
  reference: '',
  remarks: '',
};

function Inventory() {
  const [transactions, setTransactions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [materialFilter, setMaterialFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyTxnForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await api.get('/rawmaterials');
      if (res.data.success) {
        setMaterials(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load raw materials for dropdown', err);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (materialFilter) params.materialId = materialFilter;
      if (typeFilter) params.transactionType = typeFilter;
      const res = await api.get('/inventory', { params });
      if (res.data.success) {
        setTransactions(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory transactions');
    } finally {
      setLoading(false);
    }
  }, [materialFilter, typeFilter]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const selectedMaterial = materials.find((m) => m._id === form.materialId);

  const handleOpenModal = () => {
    setForm(emptyTxnForm);
    setFormError('');
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.materialId) {
      setFormError('Please select a raw material');
      return;
    }
    const qty = parseFloat(form.quantity);
    if (isNaN(qty) || qty <= 0) {
      setFormError('Quantity must be greater than zero');
      return;
    }

    // Negative stock prevention rule
    if (form.transactionType === 'OUT' && selectedMaterial && qty > selectedMaterial.currentStock) {
      setFormError(\`Negative stock prevented. Current available stock is \${selectedMaterial.currentStock} \${selectedMaterial.unit}\`);
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      await api.post('/inventory', {
        ...form,
        quantity: qty,
      });
      setModalOpen(false);
      fetchTransactions();
      fetchMaterials();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record transaction');
    } finally {
      setSaving(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const ref = (t.reference || '').toLowerCase();
    const remarks = (t.remarks || '').toLowerCase();
    const matName = (t.materialId?.materialName || '').toLowerCase();
    const id = (t.inventoryId || '').toLowerCase();
    return ref.includes(term) || remarks.includes(term) || matName.includes(term) || id.includes(term);
  });

  const totalIn = transactions.filter((t) => t.transactionType === 'IN').length;
  const totalOut = transactions.filter((t) => t.transactionType === 'OUT').length;
  const totalAdj = transactions.filter((t) => t.transactionType === 'ADJUSTMENT').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes size={20} className="text-blue-700" />
            Inventory Transactions Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of raw material receipts (IN), batch consumption (OUT), and stock reconciliations
          </p>
        </div>
        <button onClick={handleOpenModal} className="btn btn-primary shadow-xs">
          <Plus size={15} /> Record Stock Movement
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Transactions</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{transactions.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Inward Receipts (IN)</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{totalIn}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Outward Issued (OUT)</p>
          <p className="text-xl font-bold text-rose-600 mt-1">{totalOut}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Adjustments</p>
          <p className="text-xl font-bold text-purple-700 mt-1">{totalAdj}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar-bar">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 outline-none transition-colors"
            placeholder="Search by ref, material, or remarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:bg-white"
          value={materialFilter}
          onChange={(e) => setMaterialFilter(e.target.value)}
        >
          <option value="">All Materials</option>
          {materials.map((m) => (
            <option key={m._id} value={m._id}>{m.materialName}</option>
          ))}
        </select>

        <select
          className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:bg-white"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Movement Types</option>
          {TXN_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-responsive">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <span className="spinner" />
            Loading transaction audit records...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Boxes size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">No inventory transactions logged</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Stock receipts and batch consumptions will appear here.</p>
          </div>
        ) : (
          <table className="ent-table">
            <thead>
              <tr>
                <th>Txn Reference</th>
                <th>Raw Material</th>
                <th className="text-center">Movement Type</th>
                <th className="text-right">Quantity</th>
                <th>Date & Time</th>
                <th>Reference / PO</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => {
                const matName = t.materialId?.materialName || 'Material';
                const unit = t.materialId?.unit || '';
                return (
                  <tr key={t._id}>
                    <td className="font-mono font-bold text-blue-700">
                      {t.inventoryId || \`TXN-\${t._id.slice(-6).toUpperCase()}\`}
                    </td>
                    <td className="font-bold text-slate-900">{matName}</td>
                    <td className="text-center">
                      <StatusBadge value={t.transactionType} />
                    </td>
                    <td className="text-right font-mono font-bold text-slate-900">
                      <span className={t.transactionType === 'IN' ? 'text-emerald-700' : t.transactionType === 'OUT' ? 'text-rose-700' : 'text-purple-700'}>
                        {t.transactionType === 'IN' ? '+' : t.transactionType === 'OUT' ? '-' : '±'}
                        {formatNumber(t.quantity)} {unit}
                      </span>
                    </td>
                    <td className="text-slate-500 whitespace-nowrap">
                      {formatDateTime(t.createdAt)}
                    </td>
                    <td className="text-slate-700 font-mono text-[11.5px]">{t.reference || '—'}</td>
                    <td className="text-slate-500 truncate max-w-xs">{t.remarks || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Transaction Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Stock Movement (Transaction)"
        size="md"
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary btn-sm" disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="txn-form" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Recording...' : 'Commit Transaction'}
            </button>
          </>
        }
      >
        <form id="txn-form" onSubmit={handleSave} className="space-y-3 text-xs">
          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Select Raw Material *</label>
            <select
              name="materialId"
              className="form-control"
              value={form.materialId}
              onChange={handleFormChange}
              required
            >
              <option value="">-- Choose Raw Material --</option>
              {materials.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.materialName} (Current Stock: {m.currentStock} {m.unit})
                </option>
              ))}
            </select>
          </div>

          {selectedMaterial && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <span className="text-slate-600">Available Stock:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatNumber(selectedMaterial.currentStock)} {selectedMaterial.unit}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Transaction Type *</label>
              <select
                name="transactionType"
                className="form-control"
                value={form.transactionType}
                onChange={handleFormChange}
                required
              >
                <option value="IN">IN (Stock Receipt)</option>
                <option value="OUT">OUT (Production Issue)</option>
                <option value="ADJUSTMENT">ADJUSTMENT (Audit / Scrap)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity ({selectedMaterial?.unit || 'units'}) *</label>
              <input
                type="number"
                min="0.001"
                step="any"
                name="quantity"
                className="form-control"
                value={form.quantity}
                onChange={handleFormChange}
                placeholder="e.g. 50"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reference (PO # / Batch Plan #)</label>
            <input
              type="text"
              name="reference"
              className="form-control"
              value={form.reference}
              onChange={handleFormChange}
              placeholder="e.g. PO-2026-904"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Transaction Remarks</label>
            <textarea
              name="remarks"
              className="form-control"
              rows={2}
              value={form.remarks}
              onChange={handleFormChange}
              placeholder="Reason for movement or inspection note..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Inventory;
`;

fs.writeFileSync(pagesDir + '/ProductionPlanning.jsx', productionCode, 'utf8');
fs.writeFileSync(pagesDir + '/ProductionPlans.jsx', productionCode, 'utf8');
fs.writeFileSync(pagesDir + '/RawMaterialsInventory.jsx', rawMaterialsCode, 'utf8');
fs.writeFileSync(pagesDir + '/RawMaterials.jsx', rawMaterialsCode, 'utf8');
fs.writeFileSync(pagesDir + '/Inventory.jsx', inventoryCode, 'utf8');

console.log('Successfully written ProductionPlanning, RawMaterials, and Inventory');

const fs = require('fs');

const pagesDir = 'C:/Users/sabin/food-manufacturing-production/client/src/pages';
const layoutDir = 'C:/Users/sabin/food-manufacturing-production/client/src/layouts';

// 1. BOM.jsx
const bomCode = `import React, { useState, useEffect, useCallback } from 'react';
import { ScrollText, Calculator, Plus, Search, Edit2, Trash2, Package, Wheat, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { createResourceApi } from '../services/resource';
import api from '../services/api';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatNumber } from '../utils/formatters';

const bomApi = createResourceApi('/bom');

const emptyForm = {
  productId: '',
  materialId: '',
  quantityPerUnit: '',
  unit: 'kg',
};

function BOM() {
  const [activeTab, setActiveTab] = useState('recipes'); // 'recipes' | 'calculator'

  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);

  // BOM list
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Calculator
  const [calcProductId, setCalcProductId] = useState('');
  const [calcQuantity, setCalcQuantity] = useState(100);
  const [calcResults, setCalcResults] = useState([]);
  const [calcLoading, setCalcLoading] = useState(false);

  const fetchDependencies = async () => {
    try {
      const [prodRes, matRes] = await Promise.all([
        api.get('/products'),
        api.get('/rawmaterials'),
      ]);
      if (prodRes.data.success) {
        setProducts(prodRes.data.data || []);
        if (prodRes.data.data?.length > 0 && !calcProductId) {
          setCalcProductId(prodRes.data.data[0]._id);
        }
      }
      if (matRes.data.success) setMaterials(matRes.data.data || []);
    } catch (err) {
      console.error('Failed to load dependency data for BOM', err);
    }
  };

  const fetchBoms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (productFilter) params.productId = productFilter;
      const res = await bomApi.list(params);
      setBoms(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load BOM entries');
    } finally {
      setLoading(false);
    }
  }, [productFilter]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchBoms();
  }, [fetchBoms]);

  // Execute Material Calculator
  const runCalculation = useCallback(async () => {
    if (!calcProductId) {
      setCalcResults([]);
      return;
    }
    setCalcLoading(true);
    try {
      const res = await api.get('/bom/calculate', {
        params: { productId: calcProductId, quantity: calcQuantity || 1 },
      });
      if (res.data.success) {
        setCalcResults(res.data.data || res.data.requirements || []);
      }
    } catch (err) {
      // Robust fallback calculation using loaded BOM records and materials
      const productBoms = boms.filter((b) => (b.productId?._id || b.productId) === calcProductId);
      const computed = productBoms.map((b) => {
        const mat = materials.find((m) => m._id === (b.materialId?._id || b.materialId));
        const requiredQty = (Number(b.quantityPerUnit) || 0) * (Number(calcQuantity) || 1);
        const stock = mat ? Number(mat.currentStock || 0) : 0;
        const deficit = Math.max(0, requiredQty - stock);
        return {
          materialName: mat?.materialName || b.materialId?.materialName || 'Ingredient',
          unit: b.unit || mat?.unit || 'kg',
          quantityPerUnit: b.quantityPerUnit,
          requiredQuantity: requiredQty,
          currentStock: stock,
          deficit,
          status: deficit > 0 ? 'SHORTAGE' : 'SUFFICIENT',
        };
      });
      setCalcResults(computed);
    } finally {
      setCalcLoading(false);
    }
  }, [calcProductId, calcQuantity, boms, materials]);

  useEffect(() => {
    if (activeTab === 'calculator' && calcProductId) {
      runCalculation();
    }
  }, [activeTab, calcProductId, calcQuantity, runCalculation]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (bom) => {
    setEditingId(bom._id);
    setForm({
      productId: bom.productId?._id || bom.productId || '',
      materialId: bom.materialId?._id || bom.materialId || '',
      quantityPerUnit: bom.quantityPerUnit ?? '',
      unit: bom.unit || 'kg',
    });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
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
        quantityPerUnit: Number(form.quantityPerUnit),
      };

      if (editingId) {
        await bomApi.update(editingId, payload);
      } else {
        await bomApi.create(payload);
      }
      closeModal();
      fetchBoms();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save BOM item');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await bomApi.remove(deleteTarget._id);
      setDeleteTarget(null);
      fetchBoms();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete BOM item');
    }
  };

  const filteredBoms = boms.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const pName = (b.productId?.productName || '').toLowerCase();
    const mName = (b.materialId?.materialName || '').toLowerCase();
    return pName.includes(s) || mName.includes(s);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ScrollText size={20} className="text-blue-700" />
            Bill of Materials (BOM) & Recipes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hierarchical recipe definitions: Product → Ingredient Material → Quantity Per Unit
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('recipes')}
            className={\`px-3 py-1 rounded-md text-xs font-bold transition-all \${
              activeTab === 'recipes'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }\`}
          >
            Recipe Definitions
          </button>
          <button
            onClick={() => {
              setActiveTab('calculator');
              if (!calcProductId && products.length > 0) setCalcProductId(products[0]._id);
            }}
            className={\`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all \${
              activeTab === 'calculator'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }\`}
          >
            <Calculator size={13} /> Batch Requirement Calculator
          </button>
        </div>
      </div>

      {activeTab === 'recipes' ? (
        <>
          {/* Toolbar */}
          <div className="toolbar-bar justify-between">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 outline-none transition-colors"
                  placeholder="Filter by product or ingredient..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:bg-white"
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
              >
                <option value="">All Finished Products</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>{p.productName}</option>
                ))}
              </select>
            </div>

            <button onClick={openCreateModal} className="btn btn-primary btn-sm shadow-xs">
              <Plus size={14} /> Add Recipe Ingredient
            </button>
          </div>

          {/* Table */}
          <div className="table-responsive">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <span className="spinner" />
                Loading recipe items...
              </div>
            ) : filteredBoms.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <ScrollText size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">No recipe items defined</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Define ingredients required to manufacture each product unit.</p>
              </div>
            ) : (
              <table className="ent-table">
                <thead>
                  <tr>
                    <th>Finished Product</th>
                    <th>Required Raw Material</th>
                    <th className="text-right">Quantity Per Unit</th>
                    <th>Measurement Unit</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBoms.map((b) => {
                    const pName = b.productId?.productName || products.find((p) => p._id === b.productId)?.productName || 'Product';
                    const mName = b.materialId?.materialName || materials.find((m) => m._id === b.materialId)?.materialName || 'Material';
                    return (
                      <tr key={b._id}>
                        <td className="font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Package size={14} className="text-blue-700 shrink-0" />
                            <span>{pName}</span>
                          </div>
                        </td>
                        <td className="text-slate-800 font-medium">
                          <div className="flex items-center gap-2">
                            <Wheat size={14} className="text-amber-600 shrink-0" />
                            <span>{mName}</span>
                          </div>
                        </td>
                        <td className="text-right font-mono font-bold text-slate-900">
                          {formatNumber(b.quantityPerUnit)}
                        </td>
                        <td className="text-slate-500 font-medium">{b.unit || 'kg'}</td>
                        <td className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(b)}
                              className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                              title="Edit BOM item"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(b)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete BOM item"
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
        </>
      ) : (
        /* Material Requirement Calculator View */
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Calculator size={16} className="text-blue-700" />
              Batch Material Requirement Calculator (MRP)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="form-label">Finished Product</label>
                <select
                  className="form-control text-xs"
                  value={calcProductId}
                  onChange={(e) => setCalcProductId(e.target.value)}
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.productName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Planned Production Batch Size (Units)</label>
                <input
                  type="number"
                  min="1"
                  className="form-control text-xs"
                  value={calcQuantity}
                  onChange={(e) => setCalcQuantity(Number(e.target.value))}
                  placeholder="e.g. 500"
                />
              </div>
              <div>
                <button
                  onClick={runCalculation}
                  disabled={calcLoading || !calcProductId}
                  className="btn btn-primary w-full text-xs shadow-xs"
                >
                  {calcLoading ? 'Calculating...' : 'Calculate Requirements'}
                </button>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="table-responsive">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Ingredient Requirement Breakdown for {formatNumber(calcQuantity)} Units
              </p>
              <span className="text-[11px] text-slate-500 font-medium">
                Required = Quantity Per Unit × Batch Size
              </span>
            </div>

            {calcResults.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Select a product with defined recipe ingredients above to compute material requirements.
              </div>
            ) : (
              <table className="ent-table">
                <thead>
                  <tr>
                    <th>Raw Material Ingredient</th>
                    <th className="text-center">Recipe Ratio (per unit)</th>
                    <th className="text-right">Required for Batch</th>
                    <th className="text-right">Available in Stock</th>
                    <th className="text-center">Inventory Status</th>
                    <th className="text-right">Stock Deficit</th>
                  </tr>
                </thead>
                <tbody>
                  {calcResults.map((item, idx) => {
                    const matName = item.materialName || item.materialId?.materialName || 'Material';
                    const isShortage = (item.deficit > 0) || (item.status === 'SHORTAGE');
                    const unit = item.unit || 'kg';
                    return (
                      <tr key={idx} className={isShortage ? 'bg-rose-50/20' : ''}>
                        <td className="font-bold text-slate-900">{matName}</td>
                        <td className="text-center text-slate-600 font-mono">
                          {formatNumber(item.quantityPerUnit)} {unit}
                        </td>
                        <td className="text-right font-bold text-blue-700 font-mono">
                          {formatNumber(item.requiredQuantity || item.required)} {unit}
                        </td>
                        <td className="text-right font-semibold text-slate-700 font-mono">
                          {formatNumber(item.currentStock ?? item.availableStock ?? 0)} {unit}
                        </td>
                        <td className="text-center">
                          {isShortage ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle size={12} /> Shortage / Reorder
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={12} /> Stock Available
                            </span>
                          )}
                        </td>
                        <td className="text-right font-bold font-mono">
                          {isShortage ? (
                            <span className="text-rose-600">
                              -{formatNumber(item.deficit)} {unit}
                            </span>
                          ) : (
                            <span className="text-emerald-600">0.00 {unit}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Recipe Item' : 'Add Recipe Ingredient'}
        size="md"
        footer={
          <>
            <button type="button" onClick={closeModal} className="btn btn-secondary btn-sm" disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="bom-form" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Item' : 'Add to Recipe'}
            </button>
          </>
        }
      >
        <form id="bom-form" onSubmit={handleSubmit} className="space-y-3 text-xs">
          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Finished Product *</label>
            <select
              name="productId"
              className="form-control"
              value={form.productId}
              onChange={handleChange}
              required
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.productName}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Raw Material Ingredient *</label>
            <select
              name="materialId"
              className="form-control"
              value={form.materialId}
              onChange={(e) => {
                const matId = e.target.value;
                const selectedMat = materials.find((m) => m._id === matId);
                setForm((prev) => ({
                  ...prev,
                  materialId: matId,
                  unit: selectedMat?.unit || prev.unit,
                }));
              }}
              required
            >
              <option value="">-- Choose Raw Material --</option>
              {materials.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.materialName} (Available Stock: {m.currentStock} {m.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Quantity Per Unit *</label>
              <input
                type="number"
                step="any"
                min="0.0001"
                name="quantityPerUnit"
                className="form-control"
                value={form.quantityPerUnit}
                onChange={handleChange}
                placeholder="e.g. 0.25"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Measurement Unit</label>
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
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete BOM Ingredient"
        message="Are you sure you want to remove this ingredient from the recipe? Batch material calculations will be updated."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        confirmLabel="Remove Item"
        danger={true}
      />
    </div>
  );
}

export default BOM;
`;

// 2. ManufacturingProgress.jsx
const progressCode = `import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Clock, CheckCircle2, AlertTriangle, Edit2, Search } from 'lucide-react';
import { createResourceApi } from '../services/resource';
import api from '../services/api';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import ProgressBar from '../components/common/ProgressBar';
import { formatNumber, formatDateTime } from '../utils/formatters';

const progressApi = createResourceApi('/progress');

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed', 'Delayed'];

const emptyForm = {
  productionPlanId: '',
  plannedQuantity: '',
  completedQuantity: '',
  rejectedQuantity: 0,
  status: 'In Progress',
  remarks: '',
};

function ManufacturingProgress() {
  const [records, setRecords] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Update modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchDependencies = async () => {
    try {
      const res = await api.get('/productionplans');
      if (res.data.success) {
        setPlans(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load plans for progress tracking', err);
    }
  };

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await progressApi.list(params);
      setRecords(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load progress records');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const openUpdateModal = (rec) => {
    setEditingRecord(rec);
    setForm({
      productionPlanId: rec.productionPlanId?._id || rec.productionPlanId || '',
      plannedQuantity: rec.plannedQuantity ?? '',
      completedQuantity: rec.completedQuantity ?? 0,
      rejectedQuantity: rec.rejectedQuantity ?? 0,
      status: rec.status || 'In Progress',
      remarks: rec.remarks || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingRecord(null);
    setForm(emptyForm);
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
        completedQuantity: Number(form.completedQuantity),
        rejectedQuantity: Number(form.rejectedQuantity || 0),
        plannedQuantity: Number(form.plannedQuantity),
      };

      if (editingRecord?._id) {
        await progressApi.update(editingRecord._id, payload);
      } else {
        await progressApi.create(payload);
      }
      closeModal();
      fetchProgress();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record progress');
    } finally {
      setSaving(false);
    }
  };

  // KPIs
  const totalRuns = records.length;
  const inProgressCount = records.filter((r) => r.status === 'In Progress').length;
  const completedCount = records.filter((r) => r.status === 'Completed').length;
  const totalCompletedUnits = records.reduce((acc, r) => acc + (Number(r.completedQuantity) || 0), 0);

  const filteredRecords = records.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const pName = (r.productionPlanId?.productId?.productName || '').toLowerCase();
    const planNo = (r.productionPlanId?.planNumber || '').toLowerCase();
    return pName.includes(s) || planNo.includes(s);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity size={20} className="text-blue-700" />
            Manufacturing Floor Progress
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Production line execution: Progress % clamped at 100%, good yield vs scrap rejection rate
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Active Line Batches</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{inProgressCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Completed Batches</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{completedCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Yield (Units)</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatNumber(totalCompletedUnits)}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Tracked Floor Runs</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{totalRuns}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar-bar">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 outline-none transition-colors"
            placeholder="Search by product name or batch plan ref..."
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
      </div>

      {/* Table */}
      <div className="table-responsive">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <span className="spinner" />
            Loading production progress...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Activity size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">No active progress logs</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Floor progress records will populate as production plans commence.</p>
          </div>
        ) : (
          <table className="ent-table">
            <thead>
              <tr>
                <th>Plan Reference</th>
                <th>Manufactured Item</th>
                <th className="w-48 text-center">Batch Completion %</th>
                <th className="text-right">Completed / Planned</th>
                <th className="text-right">Scrap / Rejected</th>
                <th className="text-center">Floor Status</th>
                <th>Last Update</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => {
                const plan = rec.productionPlanId || {};
                const prod = plan.productId || {};
                const planned = Number(rec.plannedQuantity || plan.plannedQuantity || 1);
                const completed = Number(rec.completedQuantity || 0);
                const rejected = Number(rec.rejectedQuantity || 0);

                // Clamped at 100% max as per business requirement
                const percent = Math.min(100, Math.max(0, Math.round((completed / planned) * 100)));

                return (
                  <tr key={rec._id}>
                    <td className="font-mono font-bold text-blue-700">
                      {plan.planNumber || \`PLAN-\${rec._id.slice(-6).toUpperCase()}\`}
                    </td>
                    <td className="font-bold text-slate-900">
                      {prod.productName || 'Finished Product'}
                    </td>
                    <td className="text-center">
                      <div className="w-40 mx-auto">
                        <ProgressBar percent={percent} showLabel={true} />
                      </div>
                    </td>
                    <td className="text-right font-mono font-bold text-slate-900">
                      {formatNumber(completed)} / {formatNumber(planned)} {prod.unit || 'units'}
                    </td>
                    <td className="text-right font-mono">
                      <span className={rejected > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                        {formatNumber(rejected)}
                      </span>
                    </td>
                    <td className="text-center">
                      <StatusBadge value={rec.status || 'In Progress'} />
                    </td>
                    <td className="text-slate-500 whitespace-nowrap">
                      {formatDateTime(rec.updatedAt || rec.createdAt)}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => openUpdateModal(rec)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded transition-colors"
                      >
                        Update
                      </button>
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
        title="Update Batch Floor Progress"
        size="md"
        footer={
          <>
            <button type="button" onClick={closeModal} className="btn btn-secondary btn-sm" disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="progress-form" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save Progress Log'}
            </button>
          </>
        }
      >
        <form id="progress-form" onSubmit={handleSubmit} className="space-y-3 text-xs">
          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
              {formError}
            </div>
          )}

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <span className="text-slate-600">Batch Planned Target:</span>
            <span className="font-mono font-bold text-slate-900">
              {formatNumber(form.plannedQuantity)} units
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Good Units Completed *</label>
              <input
                type="number"
                min="0"
                name="completedQuantity"
                className="form-control"
                value={form.completedQuantity}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Defective / Scrap Units</label>
              <input
                type="number"
                min="0"
                name="rejectedQuantity"
                className="form-control"
                value={form.rejectedQuantity}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Floor Operation Status *</label>
            <select
              name="status"
              className="form-control"
              value={form.status}
              onChange={handleChange}
              required
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Shift Notes / QA Remarks</label>
            <textarea
              name="remarks"
              className="form-control"
              rows={2}
              value={form.remarks}
              onChange={handleChange}
              placeholder="e.g. Line 2 running smoothly, batch test passed QA."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ManufacturingProgress;
`;

// 3. Alerts.jsx
const alertsCode = `import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, AlertTriangle, Clock, CheckCircle2, RefreshCw, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatusBadge from '../components/common/StatusBadge';
import { timeAgo, formatDateTime } from '../utils/formatters';

function getAlertIcon(type) {
  switch (type) {
    case 'LOW_STOCK':
    case 'MATERIAL_SHORTAGE':
      return <AlertTriangle size={16} className="text-rose-600" />;
    case 'PRODUCTION_DELAY':
      return <Clock size={16} className="text-amber-600" />;
    case 'PRODUCTION_COMPLETED':
      return <CheckCircle2 size={16} className="text-emerald-600" />;
    default:
      return <Bell size={16} className="text-blue-700" />;
  }
}

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterRead, setFilterRead] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterRead === 'unread') params.isRead = 'false';
      if (filterRead === 'read') params.isRead = 'true';
      if (severityFilter) params.severity = severityFilter;

      const res = await api.get('/alerts', { params });
      if (res.data.success) {
        setAlerts(res.data.data || []);
        setUnreadCount(res.data.unreadCount ?? (res.data.data || []).filter((a) => !a.isRead).length);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load system alerts');
    } finally {
      setLoading(false);
    }
  }, [filterRead, severityFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleMarkRead = async (id) => {
    try {
      await api.put(\`/alerts/\${id}/read\`);
      fetchAlerts();
    } catch (err) {
      console.error('Failed to mark alert as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/alerts/mark-all-read');
      fetchAlerts();
    } catch (err) {
      console.error('Failed to mark all alerts as read', err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(\`/alerts/\${deleteTarget._id}\`);
      setDeleteTarget(null);
      fetchAlerts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete alert');
    }
  };

  const criticalCount = alerts.filter((a) => a.severity === 'Critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'High' || a.severity === 'Warning' || a.severity === 'Medium').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert size={20} className="text-blue-700" />
            System Alerts & Operational Safeguards
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Severity classifications: Critical, High, Medium, Low thresholds for inventory deficits and delays
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn btn-secondary btn-sm"
              title="Acknowledge all unread notifications"
            >
              <CheckCheck size={14} /> Mark All Acknowledged
            </button>
          )}
          <button
            onClick={fetchAlerts}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
            title="Refresh alerts"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Alerts</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{alerts.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Unread / Active</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{unreadCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Critical Severity</p>
          <p className="text-xl font-bold text-rose-600 mt-1">{criticalCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Warnings / Medium</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{warningCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar-bar justify-between">
        <div className="flex items-center gap-1.5">
          {[
            { key: 'all', label: 'All Alerts' },
            { key: 'unread', label: \`Unread (\${unreadCount})\` },
            { key: 'read', label: 'Acknowledged' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterRead(tab.key)}
              className={\`px-2.5 py-1 rounded text-xs font-bold transition-all \${
                filterRead === tab.key
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }\`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:bg-white"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Alert List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2 bg-white rounded-xl border border-slate-200">
            <span className="spinner" />
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
            <p className="text-xs font-bold text-slate-700">No active alerts</p>
            <p className="text-[11px] text-slate-400 mt-0.5">All manufacturing lines, stock levels, and order deadlines are nominal.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isUnread = !alert.isRead;
            return (
              <div
                key={alert._id}
                className={\`p-3.5 rounded-lg border transition-all flex items-start justify-between gap-3 \${
                  isUnread
                    ? 'bg-white border-blue-200 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 opacity-90'
                }\`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {alert.title || alert.type?.replace(/_/g, ' ') || 'Notice'}
                      </p>
                      <StatusBadge value={alert.severity || 'Critical'} />
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-700" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">{alert.message}</p>
                    <p className="text-[10.5px] text-slate-400 mt-1 font-medium">
                      {timeAgo(alert.createdAt)} • {formatDateTime(alert.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isUnread && (
                    <button
                      onClick={() => handleMarkRead(alert._id)}
                      className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                      title="Acknowledge alert"
                    >
                      <Check size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget(alert)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Dismiss alert"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Dismiss Alert"
        message="Are you sure you want to dismiss this system notification?"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        confirmLabel="Dismiss"
        danger={true}
      />
    </div>
  );
}

export default Alerts;
`;

// 4. Reports.jsx
const reportsCode = `import React, { useState, useEffect, useCallback } from 'react';
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
import { FileBarChart2, Printer, Download, Factory, Boxes, TrendingUp } from 'lucide-react';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, formatNumber } from '../utils/formatters';

const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function Reports() {
  const [activeTab, setActiveTab] = useState('summary');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sumRes, prodRes, invRes, demRes] = await Promise.all([
        api.get('/reports/summary').catch(() => ({ data: {} })),
        api.get('/reports/production').catch(() => ({ data: {} })),
        api.get('/reports/inventory').catch(() => ({ data: {} })),
        api.get('/reports/demands').catch(() => ({ data: {} })),
      ]);

      setData({
        summary: sumRes.data.data || {},
        production: prodRes.data.data || {},
        inventory: invRes.data.data || {},
        demands: demRes.data.data || {},
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to aggregate report data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const jsonStr = \`data:text/json;charset=utf-8,\${encodeURIComponent(JSON.stringify(data, null, 2))}\`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', \`FoodManu_Production_Report_\${new Date().toISOString().slice(0, 10)}.json\`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2 bg-white rounded-xl border border-slate-200">
        <span className="spinner" />
        Aggregating operational analytics and performance reports...
      </div>
    );
  }

  const { production = {}, inventory = {}, demands = {} } = data || {};

  const prodStatusChartData = Object.entries(production.byStatus || {}).map(([name, count]) => ({
    name,
    count,
  }));

  const invStatusChartData = Object.entries(inventory.byStatus || {}).map(([name, count]) => ({
    name,
    count,
  }));

  const demandPriorityData = Object.entries(demands.byPriority || {}).map(([name, count]) => ({
    name,
    count,
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileBarChart2 size={20} className="text-blue-700" />
            Executive Production & Inventory Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational yield metrics, inventory valuation, and commercial fulfillment ratios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn btn-secondary btn-sm shadow-2xs">
            <Download size={13} /> Export JSON
          </button>
          <button onClick={handlePrint} className="btn btn-primary btn-sm shadow-xs">
            <Printer size={13} /> Print Summary
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center gap-1">
        {[
          { key: 'summary', label: 'Executive Overview', icon: FileBarChart2 },
          { key: 'production', label: 'Production Runs', icon: Factory },
          { key: 'inventory', label: 'Inventory Valuation', icon: Boxes },
          { key: 'demand', label: 'Demand Pipeline', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all \${
                activeTab === tab.key
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }\`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Executive Overview */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Planned Run Batches" value={production.totalPlans ?? 0} icon={Factory} color="indigo" />
            <StatCard label="Completed Batch Output" value={formatNumber(production.totalCompleted ?? 0)} icon={FileBarChart2} color="green" />
            <StatCard label="Raw Materials Tracked" value={inventory.totalMaterials ?? 0} icon={Boxes} color="blue" />
            <StatCard label="Total Stock Valuation" value={formatCurrency(inventory.totalValue ?? 0)} icon={TrendingUp} color="purple" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
                Production Plan Distribution by Status
              </h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prodStatusChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10.5, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
                Raw Material Stock Availability
              </h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={invStatusChartData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label
                    >
                      {invStatusChartData.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Production Tab */}
      {activeTab === 'production' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Planned Units" value={formatNumber(production.totalPlanned ?? 0)} icon={Factory} color="blue" />
            <StatCard label="Completed Units" value={formatNumber(production.totalCompleted ?? 0)} icon={FileBarChart2} color="green" />
            <StatCard label="Completion Efficiency" value={\`\${production.completionRate ?? 0}%\`} icon={TrendingUp} color="indigo" />
          </div>

          <div className="table-responsive">
            <div className="p-3 border-b border-slate-100 bg-white">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Production Runs Summary
              </p>
            </div>
            <table className="ent-table">
              <thead>
                <tr>
                  <th>Plan Reference</th>
                  <th>Manufactured Product</th>
                  <th className="text-right">Planned Batch Size</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {(production.plans || []).slice(0, 15).map((p) => (
                  <tr key={p._id}>
                    <td className="font-mono font-bold text-blue-700">{p.planNumber || p._id.slice(-6)}</td>
                    <td className="font-medium text-slate-900">{p.productId?.productName || 'Product'}</td>
                    <td className="text-right font-mono font-bold text-slate-900">{formatNumber(p.plannedQuantity)}</td>
                    <td className="text-center">
                      <StatusBadge value={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Raw Materials" value={inventory.totalMaterials ?? 0} icon={Boxes} color="blue" />
            <StatCard label="Total Stock Valuation" value={formatCurrency(inventory.totalValue ?? 0)} icon={TrendingUp} color="green" />
            <StatCard label="Transaction Audit Count" value={(inventory.transactions || []).length} icon={FileBarChart2} color="purple" />
          </div>

          <div className="table-responsive">
            <div className="p-3 border-b border-slate-100 bg-white">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Ingredient Valuation Ledger
              </p>
            </div>
            <table className="ent-table">
              <thead>
                <tr>
                  <th>Ingredient Name</th>
                  <th className="text-right">Current Stock</th>
                  <th className="text-right">Unit Cost</th>
                  <th className="text-right">Extended Value</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {(inventory.materials || []).map((m) => {
                  const extVal = (Number(m.currentStock) || 0) * (Number(m.unitCost) || 0);
                  return (
                    <tr key={m._id}>
                      <td className="font-bold text-slate-900">{m.materialName}</td>
                      <td className="text-right font-mono font-bold text-slate-900">
                        {formatNumber(m.currentStock)} {m.unit}
                      </td>
                      <td className="text-right font-mono text-slate-600">
                        {formatCurrency(m.unitCost)}
                      </td>
                      <td className="text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(extVal)}
                      </td>
                      <td className="text-center">
                        <StatusBadge value={m.status || (m.currentStock <= (m.minimumStock || 0) ? 'Low Stock' : 'In Stock')} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Demand Tab */}
      {activeTab === 'demand' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Orders" value={demands.totalDemands ?? 0} icon={TrendingUp} color="blue" />
            <StatCard label="Pending Approval" value={demands.byStatus?.Pending ?? 0} icon={Factory} color="yellow" />
            <StatCard label="In Production" value={demands.byStatus?.['In Production'] ?? 0} icon={Boxes} color="indigo" />
            <StatCard label="Fulfilled Orders" value={demands.byStatus?.Completed ?? 0} icon={FileBarChart2} color="green" />
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
              Demand Distribution by Priority Tier
            </h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demandPriorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10.5, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
`;

// 5. MainLayout.jsx with unread alert count fetching
const mainLayoutCode = `import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import api from '../services/api';

const TITLE_MAP = {
  '/dashboard': 'Production Dashboard',
  '/products': 'Product Management',
  '/demands': 'Demand & Work Orders',
  '/demand': 'Demand & Work Orders',
  '/production': 'Production Planning',
  '/production-planning': 'Production Planning',
  '/raw-materials': 'Raw Material Stock Control',
  '/inventory': 'Inventory Transactions',
  '/bom': 'Bill of Materials (BOM)',
  '/progress': 'Manufacturing Floor Progress',
  '/alerts': 'System Alerts & Safeguards',
  '/reports': 'Analytics & Executive Reports',
};

function MainLayout() {
  const location = useLocation();
  const title = TITLE_MAP[location.pathname] || 'Food Manufacturing PMS';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadAlerts = async () => {
    try {
      const res = await api.get('/alerts?isRead=false');
      if (res.data.success) {
        setUnreadCount(res.data.unreadCount ?? (res.data.data || []).length);
      }
    } catch {
      // ignore in background
    }
  };

  useEffect(() => {
    fetchUnreadAlerts();
    // Poll alerts every 60s
    const timer = setInterval(fetchUnreadAlerts, 60000);
    return () => clearInterval(timer);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased text-slate-800">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={title}
          unreadAlertsCount={unreadCount}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-5">
          <div className="max-w-[1360px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
`;

fs.writeFileSync(pagesDir + '/BOM.jsx', bomCode, 'utf8');
fs.writeFileSync(pagesDir + '/ManufacturingProgress.jsx', progressCode, 'utf8');
fs.writeFileSync(pagesDir + '/Alerts.jsx', alertsCode, 'utf8');
fs.writeFileSync(pagesDir + '/Reports.jsx', reportsCode, 'utf8');
fs.writeFileSync(layoutDir + '/MainLayout.jsx', mainLayoutCode, 'utf8');

console.log('Successfully written BOM, ManufacturingProgress, Alerts, Reports, and MainLayout');

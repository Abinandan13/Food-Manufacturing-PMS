const fs = require('fs');

const pagesDir = 'C:/Users/sabin/food-manufacturing-production/client/src/pages';

// 1. Products.jsx
const productsCode = `import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Package, Tag, Clock, IndianRupee, Layers, CheckCircle2 } from 'lucide-react';
import { createResourceApi } from '../services/resource';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatCurrency, formatNumber } from '../utils/formatters';

const productsApi = createResourceApi('/products');

const STATUS_OPTIONS = ['Active', 'Inactive'];

const emptyForm = {
  productName: '',
  category: '',
  description: '',
  unit: 'units',
  price: '',
  productionTime: '',
  status: 'Active',
};

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const json = await productsApi.list(params);
      setProducts(json.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingId(product._id);
    setForm({
      productName: product.productName || '',
      category: product.category || '',
      description: product.description || '',
      unit: product.unit || 'units',
      price: product.price ?? '',
      productionTime: product.productionTime ?? '',
      status: product.status || 'Active',
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
        price: form.price === '' ? 0 : Number(form.price),
        productionTime: form.productionTime === '' ? 0 : Number(form.productionTime),
      };

      if (editingId) {
        await productsApi.update(editingId, payload);
      } else {
        await productsApi.create(payload);
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await productsApi.remove(deleteTarget._id);
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const totalCount = products.length;
  const activeCount = products.filter((p) => p.status === 'Active').length;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package size={20} className="text-blue-700" />
            Product Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manufactured finished goods, unit packaging specifications, and standard batch timings
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary shadow-xs">
          <Plus size={15} /> Add New Product
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Catalog Lines</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Active in Production</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Product Categories</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{categories.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">System Compliance</p>
          <p className="text-xs font-bold text-emerald-700 mt-2 flex items-center gap-1">
            <CheckCircle2 size={14} /> Ready for Production
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="toolbar-bar">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 outline-none transition-colors"
            placeholder="Search by product name or description..."
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Error Callout */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchProducts} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Data Table */}
      <div className="table-responsive">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <span className="spinner" />
            Loading catalog data...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Package size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">No products found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Add finished products above to establish production recipes.</p>
          </div>
        ) : (
          <table className="ent-table">
            <thead>
              <tr>
                <th className="w-1/3">Product Name</th>
                <th>Category</th>
                <th>Unit of Measure</th>
                <th className="text-right">Unit Price</th>
                <th className="text-center">Batch Time</th>
                <th className="text-center">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td className="font-bold text-slate-900">
                    <div>{p.productName}</div>
                    {p.description && (
                      <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs">{p.description}</div>
                    )}
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      <Tag size={10} className="text-slate-400" /> {p.category || 'General'}
                    </span>
                  </td>
                  <td className="text-slate-600">{p.unit || 'units'}</td>
                  <td className="text-right font-mono font-bold text-slate-900">
                    {formatCurrency(p.price)}
                  </td>
                  <td className="text-center text-slate-600 font-mono">
                    {p.productionTime ? \`\${p.productionTime} min\` : '—'}
                  </td>
                  <td className="text-center">
                    <StatusBadge value={p.status || 'Active'} />
                  </td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Product"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Product Specification' : 'Add New Product'}
        size="md"
        footer={
          <>
            <button type="button" onClick={closeModal} className="btn btn-secondary btn-sm" disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="product-form" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="space-y-3 text-xs">
          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              name="productName"
              className="form-control"
              value={form.productName}
              onChange={handleChange}
              placeholder="e.g. Tomato Puree 500g"
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
                placeholder="e.g. Sauces & Pastes"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unit of Measure *</label>
              <input
                type="text"
                name="unit"
                className="form-control"
                value={form.unit}
                onChange={handleChange}
                placeholder="units, bottles, jars, kg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Selling Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="price"
                className="form-control"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Batch Production Time (minutes)</label>
              <input
                type="number"
                min="0"
                name="productionTime"
                className="form-control"
                value={form.productionTime}
                onChange={handleChange}
                placeholder="e.g. 45"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Production Status</label>
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

          <div className="form-group">
            <label className="form-label">Product Description / QA Notes</label>
            <textarea
              name="description"
              className="form-control"
              rows={2}
              value={form.description}
              onChange={handleChange}
              placeholder="Packaging details, batch temperature controls..."
            />
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Product"
        message={\`Are you sure you want to delete "\${deleteTarget?.productName}"? Active BOM recipes and production plans linked to it may be affected.\`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        confirmLabel="Delete Product"
        danger={true}
      />
    </div>
  );
}

export default Products;
`;

// 2. Demand.jsx
const demandCode = `import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, TrendingUp, Calendar, AlertCircle, Building2 } from 'lucide-react';
import { createResourceApi } from '../services/resource';
import api from '../services/api';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatDate, formatNumber, getDueDateStatus } from '../utils/formatters';

const demandsApi = createResourceApi('/demands');

const STATUS_OPTIONS = ['Pending', 'Approved', 'In Production', 'Completed', 'Cancelled'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

const emptyForm = {
  productId: '',
  customerName: '',
  quantity: '',
  demandDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  priority: 'Medium',
  status: 'Pending',
  notes: '',
};

function Demand() {
  const [demands, setDemands] = useState([]);
  const [products, setProducts] = useState([]);
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

  const fetchDependencies = async () => {
    try {
      const res = await api.get('/products');
      if (res.data.success) {
        setProducts(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load products for demand dropdown', err);
    }
  };

  const fetchDemands = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const json = await demandsApi.list(params);
      setDemands(json.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load demands');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchDemands, 300);
    return () => clearTimeout(t);
  }, [fetchDemands]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (demand) => {
    setEditingId(demand._id);
    setForm({
      productId: demand.productId?._id || demand.productId || '',
      customerName: demand.customerName || '',
      quantity: demand.quantity ?? '',
      demandDate: demand.demandDate ? new Date(demand.demandDate).toISOString().slice(0, 10) : '',
      dueDate: demand.dueDate ? new Date(demand.dueDate).toISOString().slice(0, 10) : '',
      priority: demand.priority || 'Medium',
      status: demand.status || 'Pending',
      notes: demand.notes || '',
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
        quantity: Number(form.quantity),
      };

      if (editingId) {
        await demandsApi.update(editingId, payload);
      } else {
        await demandsApi.create(payload);
      }
      closeModal();
      fetchDemands();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save demand order');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await demandsApi.remove(deleteTarget._id);
      setDeleteTarget(null);
      fetchDemands();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete demand');
    }
  };

  // KPIs
  const totalCount = demands.length;
  const pendingCount = demands.filter((d) => d.status === 'Pending').length;
  const inProdCount = demands.filter((d) => d.status === 'In Production').length;
  const completedCount = demands.filter((d) => d.status === 'Completed').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-700" />
            Demand & Work Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer order forecasts, commercial fulfillment deadlines, and scheduling priorities
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary shadow-xs">
          <Plus size={15} /> Create Demand Order
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Work Orders</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Pending Approval</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">On Floor (In Prod)</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{inProdCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Fulfilled Orders</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{completedCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar-bar">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 outline-none transition-colors"
            placeholder="Search by customer name or product..."
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
            Loading customer demands...
          </div>
        ) : demands.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <TrendingUp size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">No demand orders found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Register customer orders to generate factory production plans.</p>
          </div>
        ) : (
          <table className="ent-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Target Product</th>
                <th className="text-right">Quantity</th>
                <th>Order Date</th>
                <th>Delivery Due Date</th>
                <th className="text-center">Priority</th>
                <th className="text-center">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {demands.map((d) => {
                const pName = d.productId?.productName || products.find((p) => p._id === d.productId)?.productName || 'Product';
                const dueStatus = getDueDateStatus(d.dueDate);
                return (
                  <tr key={d._id}>
                    <td className="font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-slate-400 shrink-0" />
                        <span>{d.customerName}</span>
                      </div>
                    </td>
                    <td className="text-slate-800 font-medium">{pName}</td>
                    <td className="text-right font-mono font-bold text-slate-900">
                      {formatNumber(d.quantity)} {d.productId?.unit || 'units'}
                    </td>
                    <td className="text-slate-500">{formatDate(d.demandDate)}</td>
                    <td>
                      <span className={\`inline-flex items-center gap-1 font-semibold text-xs \${
                        dueStatus === 'overdue' ? 'text-rose-600' : dueStatus === 'urgent' ? 'text-amber-600' : 'text-slate-700'
                      }\`}>
                        <Calendar size={12} className="text-slate-400" />
                        {formatDate(d.dueDate)}
                      </span>
                    </td>
                    <td className="text-center">
                      <StatusBadge value={d.priority || 'Medium'} />
                    </td>
                    <td className="text-center">
                      <StatusBadge value={d.status || 'Pending'} />
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(d)}
                          className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Demand"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(d)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Demand"
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
        title={editingId ? 'Edit Customer Demand' : 'Create Demand Order'}
        size="md"
        footer={
          <>
            <button type="button" onClick={closeModal} className="btn btn-secondary btn-sm" disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="demand-form" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Demand' : 'Create Demand'}
            </button>
          </>
        }
      >
        <form id="demand-form" onSubmit={handleSubmit} className="space-y-3 text-xs">
          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Customer / Retailer Name *</label>
            <input
              type="text"
              name="customerName"
              className="form-control"
              value={form.customerName}
              onChange={handleChange}
              placeholder="e.g. Metro Supermarkets Ltd"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Select Finished Product *</label>
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
              <label className="form-label">Order Quantity *</label>
              <input
                type="number"
                min="1"
                name="quantity"
                className="form-control"
                value={form.quantity}
                onChange={handleChange}
                placeholder="e.g. 500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Order Date</label>
              <input
                type="date"
                name="demandDate"
                className="form-control"
                value={form.demandDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Delivery Due Date *</label>
              <input
                type="date"
                name="dueDate"
                className="form-control"
                value={form.dueDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Order Priority</label>
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
              <label className="form-label">Demand Status</label>
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
        title="Delete Customer Demand"
        message={\`Are you sure you want to delete the order for "\${deleteTarget?.customerName}"? Any linked production plans will need rescheduling.\`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        confirmLabel="Delete Demand"
        danger={true}
      />
    </div>
  );
}

export default Demand;
`;

fs.writeFileSync(pagesDir + '/Products.jsx', productsCode, 'utf8');
fs.writeFileSync(pagesDir + '/Demand.jsx', demandCode, 'utf8');
fs.writeFileSync(pagesDir + '/Demands.jsx', demandCode, 'utf8');

console.log('Successfully polished Products.jsx and Demand.jsx');

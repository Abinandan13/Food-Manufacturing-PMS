import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Search, Edit2, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { createResourceApi } from '../services/resource';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';

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
      const json = await productsApi.list(params);
      setProducts(json.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

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
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (Number(form.price) < 0) { setFormError('Price cannot be negative.'); return; }
    if (Number(form.productionTime) < 0) { setFormError('Production time cannot be negative.'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        productionTime: Number(form.productionTime) || 1,
      };
      if (editingId) {
        await productsApi.update(editingId, payload);
      } else {
        await productsApi.create(payload);
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Save failed');
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
      setError(err.response?.data?.message || 'Delete failed');
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">Product Catalog</h1>
          <p className="page-header-desc">Manage all products manufactured by your facility</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={fetchProducts}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={14} /> New Product
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar" style={{ width: 280 }}>
            <Search size={15} className="search-bar-icon" />
            <input
              type="text"
              placeholder="Search by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="toolbar-right">
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
            {products.length} product{products.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Price</th>
              <th>Prod. Time (hrs)</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <div className="spinner spinner-primary" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    Loading products...
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} className="data-table-empty">
                  <Package size={32} style={{ margin: '0 auto 10px', color: 'var(--gray-300)' }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No products found</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>
                    {search || statusFilter ? 'Try adjusting your filters.' : 'Click "New Product" to add your first product.'}
                  </p>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 12, fontFamily: 'monospace' }}>
                      {product.productId}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{product.productName}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{product.category || '—'}</td>
                  <td>{product.unit}</td>
                  <td style={{ fontWeight: 600 }}>₹{product.price?.toFixed(2)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{product.productionTime}h</td>
                  <td><StatusBadge status={product.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(product)}
                        style={{ padding: '5px 10px' }}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => setDeleteTarget(product)}
                        style={{ padding: '5px 10px', background: 'var(--danger-50)', color: 'var(--danger)', border: '1px solid var(--danger-light)' }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Product' : 'New Product'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? (<><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</>) : (editingId ? 'Save Changes' : 'Create Product')}
            </button>
          </>
        }
      >
        {formError && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <AlertCircle size={14} />
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label form-label-required">Product Name</label>
            <input className="form-control" type="text" name="productName" value={form.productName} onChange={handleChange} required placeholder="e.g. Wheat Bread 500g" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="form-control" type="text" name="category" value={form.category} onChange={handleChange} placeholder="e.g. Bakery" />
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <input className="form-control" type="text" name="unit" value={form.unit} onChange={handleChange} placeholder="units, kg, litres..." />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Optional product description" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Price (₹)</label>
              <input className="form-control" type="number" name="price" value={form.price} onChange={handleChange} min="0" step="0.01" placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Production Time (hrs)</label>
              <input className="form-control" type="number" name="productionTime" value={form.productionTime} onChange={handleChange} min="0" placeholder="0" />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select className="form-control" name="status" value={form.status} onChange={handleChange}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Product?"
        message={`This will permanently delete "${deleteTarget?.productName}". This action cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default Products;

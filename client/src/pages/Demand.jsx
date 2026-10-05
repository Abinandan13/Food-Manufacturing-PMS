import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Plus, Search, Edit2, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { createResourceApi } from '../services/resource';
import api from '../services/api';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';

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

  const fetchDemands = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const json = await demandsApi.list(params);
      setDemands(json.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load demands');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/products');
      if (res.data.success) setProducts(res.data.data);
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchDemands, 300);
    return () => clearTimeout(t);
  }, [fetchDemands]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openCreateModal = () => { setEditingId(null); setForm(emptyForm); setFormError(''); setModalOpen(true); };
  const openEditModal = (d) => {
    setEditingId(d._id);
    setForm({
      productId: d.productId?._id || '',
      customerName: d.customerName || '',
      quantity: d.quantity ?? '',
      demandDate: d.demandDate ? d.demandDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      dueDate: d.dueDate ? d.dueDate.slice(0, 10) : '',
      priority: d.priority || 'Medium',
      status: d.status || 'Pending',
      notes: d.notes || '',
    });
    setFormError(''); setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(emptyForm); setFormError(''); };
  const handleChange = (e) => { const { name, value } = e.target; setForm((p) => ({ ...p, [name]: value })); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError('');
    if (Number(form.quantity) < 1) { setFormError('Quantity must be at least 1.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, quantity: Number(form.quantity) };
      if (editingId) { await demandsApi.update(editingId, payload); }
      else { await demandsApi.create(payload); }
      closeModal(); fetchDemands();
    } catch (err) { setFormError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await demandsApi.remove(deleteTarget._id); setDeleteTarget(null); fetchDemands(); }
    catch (err) { setError(err.response?.data?.message || 'Delete failed'); setDeleteTarget(null); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">Customer Demands</h1>
          <p className="page-header-desc">Track customer orders and feed them into production planning</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={fetchDemands}><RefreshCw size={14} /> Refresh</button>
          <button className="btn btn-primary" onClick={openCreateModal}><Plus size={14} /> New Demand</button>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}><AlertCircle size={15} /><span>{error}</span></div>}

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar" style={{ width: 260 }}>
            <Search size={15} className="search-bar-icon" />
            <input type="text" placeholder="Search by customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="toolbar-right">
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{demands.length} demand{demands.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Demand ID</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div className="spinner spinner-primary" style={{ width: 18, height: 18, borderWidth: 2 }} /> Loading demands...
                </div>
              </td></tr>
            ) : demands.length === 0 ? (
              <tr><td colSpan={8} className="data-table-empty">
                <TrendingUp size={32} style={{ margin: '0 auto 10px', color: 'var(--gray-300)' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No demands found</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>{search || statusFilter || priorityFilter ? 'Try adjusting filters.' : 'Click "New Demand" to add one.'}</p>
              </td></tr>
            ) : demands.map((d) => (
              <tr key={d._id}>
                <td><span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 12, fontFamily: 'monospace' }}>{d.demandId}</span></td>
                <td style={{ fontWeight: 600 }}>{d.customerName}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{d.productId?.productName || '—'}</td>
                <td style={{ fontWeight: 600 }}>{d.quantity?.toLocaleString()}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{d.dueDate?.slice(0, 10) || '—'}</td>
                <td><StatusBadge status={d.priority} /></td>
                <td><StatusBadge status={d.status} /></td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(d)} style={{ padding: '5px 10px' }}><Edit2 size={13} /> Edit</button>
                    <button className="btn btn-sm" onClick={() => setDeleteTarget(d)} style={{ padding: '5px 10px', background: 'var(--danger-50)', color: 'var(--danger)', border: '1px solid var(--danger-light)' }}><Trash2 size={13} /> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Edit Demand' : 'New Customer Demand'}
        footer={<>
          <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</> : (editingId ? 'Save Changes' : 'Create Demand')}
          </button>
        </>}
      >
        {formError && <div className="alert alert-danger" style={{ marginBottom: 14 }}><AlertCircle size={14} /><span>{formError}</span></div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label form-label-required">Product</label>
            <select className="form-control" name="productId" value={form.productId} onChange={handleChange} required>
              <option value="">Select a product...</option>
              {products.map((p) => <option key={p._id} value={p._id}>{p.productName}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label form-label-required">Customer Name</label>
            <input className="form-control" type="text" name="customerName" value={form.customerName} onChange={handleChange} required placeholder="e.g. ABC Supermarket" />
          </div>
          <div className="form-group">
            <label className="form-label form-label-required">Quantity</label>
            <input className="form-control" type="number" name="quantity" value={form.quantity} onChange={handleChange} min="1" required placeholder="0" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label form-label-required">Demand Date</label>
              <input className="form-control" type="date" name="demandDate" value={form.demandDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">Due Date</label>
              <input className="form-control" type="date" name="dueDate" value={form.dueDate} onChange={handleChange} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" name="priority" value={form.priority} onChange={handleChange}>
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Notes</label>
            <textarea className="form-control" name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Optional notes..." />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Demand?"
        message={`This will permanently delete the demand from "${deleteTarget?.customerName}". This action cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default Demand;

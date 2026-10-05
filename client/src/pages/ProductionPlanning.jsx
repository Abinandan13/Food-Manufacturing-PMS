import React, { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Plus, Edit2, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { createResourceApi } from '../services/resource';
import api from '../services/api';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';

const productionPlansApi = createResourceApi('/productionplans');

const STATUS_OPTIONS = ['Planned', 'Scheduled', 'In Progress', 'Completed', 'Delayed', 'Cancelled'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

const emptyForm = {
  productId: '',
  demandId: '',
  plannedQuantity: '',
  startDate: '',
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

  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const json = await productionPlansApi.list(params);
      setPlans(json.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load production plans');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  const fetchLookups = useCallback(async () => {
    try {
      const [prodRes, demRes] = await Promise.all([
        api.get('/products'),
        api.get('/demands'),
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (demRes.data.success) setDemands(demRes.data.data);
    } catch {
      // Non-fatal — dropdowns just stay empty.
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);
  useEffect(() => { fetchLookups(); }, [fetchLookups]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingId(plan._id);
    setForm({
      productId: plan.productId?._id || '',
      demandId: plan.demandId?._id || '',
      plannedQuantity: plan.plannedQuantity,
      startDate: plan.startDate ? plan.startDate.slice(0, 10) : '',
      endDate: plan.endDate ? plan.endDate.slice(0, 10) : '',
      priority: plan.priority,
      status: plan.status,
      notes: plan.notes || '',
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

  const handleDemandChange = (e) => {
    const demandId = e.target.value;
    const selected = demands.find((d) => d._id === demandId);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        demandId,
        productId: selected.productId?._id || selected.productId || prev.productId,
        plannedQuantity: Math.max(0, selected.quantity || 0),
        priority: selected.priority || prev.priority,
      }));
    } else {
      setForm((prev) => ({ ...prev, demandId }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (Number(form.plannedQuantity) < 0) {
      setFormError('Planned quantity cannot be negative.');
      return;
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setFormError('End date cannot be before start date.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        plannedQuantity: Number(form.plannedQuantity),
        demandId: form.demandId || undefined,
      };

      if (editingId) {
        await productionPlansApi.update(editingId, payload);
      } else {
        await productionPlansApi.create(payload);
      }

      closeModal();
      fetchPlans();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Save failed');
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
      setError(err.response?.data?.message || 'Delete failed');
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">Production Planning</h1>
          <p className="page-header-desc">Create and track production runs against customer demand</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={fetchPlans}><RefreshCw size={14} /> Refresh</button>
          <button className="btn btn-primary" onClick={openCreateModal}><Plus size={14} /> New Plan</button>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}><AlertCircle size={15} /><span>{error}</span></div>}

      <div className="toolbar">
        <div className="toolbar-left">
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
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{plans.length} plan{plans.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Plan ID</th>
              <th>Product</th>
              <th>Planned Qty</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div className="spinner spinner-primary" style={{ width: 18, height: 18, borderWidth: 2 }} /> Loading plans...
                </div>
              </td></tr>
            ) : plans.length === 0 ? (
              <tr><td colSpan={8} className="data-table-empty">
                <CalendarDays size={32} style={{ margin: '0 auto 10px', color: 'var(--gray-300)' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No production plans yet</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Click "New Plan" to create your first production run.</p>
              </td></tr>
            ) : plans.map((plan) => (
              <tr key={plan._id}>
                <td><span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 12, fontFamily: 'monospace' }}>{plan.planId}</span></td>
                <td style={{ fontWeight: 600 }}>{plan.productId?.productName || '—'}</td>
                <td style={{ fontWeight: 600 }}>{plan.plannedQuantity?.toLocaleString()}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{plan.startDate?.slice(0, 10) || '—'}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{plan.endDate?.slice(0, 10) || '—'}</td>
                <td><StatusBadge status={plan.priority} /></td>
                <td><StatusBadge status={plan.status} /></td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(plan)} style={{ padding: '5px 10px' }}><Edit2 size={13} /> Edit</button>
                    <button className="btn btn-sm" onClick={() => setDeleteTarget(plan)} style={{ padding: '5px 10px', background: 'var(--danger-50)', color: 'var(--danger)', border: '1px solid var(--danger-light)' }}><Trash2 size={13} /> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Edit Production Plan' : 'New Production Plan'}
        footer={<>
          <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</> : (editingId ? 'Save Changes' : 'Create Plan')}
          </button>
        </>}
      >
        {formError && <div className="alert alert-danger" style={{ marginBottom: 14 }}><AlertCircle size={14} /><span>{formError}</span></div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label form-label-required">Product</label>
            <select className="form-control" name="productId" value={form.productId} onChange={handleChange} required>
              <option value="">Select product...</option>
              {products.map((p) => <option key={p._id} value={p._id}>{p.productName}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Linked Demand</label>
            <select className="form-control" name="demandId" value={form.demandId} onChange={handleDemandChange}>
              <option value="">None (Independent Production)</option>
              {demands.map((d) => <option key={d._id} value={d._id}>{d.demandId} — {d.customerName} (Qty: {d.quantity})</option>)}
            </select>
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0 }}>Planned Quantity</label>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Formula: demand qty − available stock</span>
            </div>
            <input className="form-control" type="number" name="plannedQuantity" value={form.plannedQuantity} onChange={handleChange} min="0" required placeholder="0" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label form-label-required">Start Date</label>
              <input className="form-control" type="date" name="startDate" value={form.startDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">End Date</label>
              <input className="form-control" type="date" name="endDate" value={form.endDate} onChange={handleChange} required />
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
        title="Delete Production Plan?"
        message={`This will permanently delete plan "${deleteTarget?.planId}". This action cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default ProductionPlanning;

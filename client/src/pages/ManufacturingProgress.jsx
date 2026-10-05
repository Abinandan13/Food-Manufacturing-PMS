import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Plus, Edit2, AlertCircle, RefreshCw } from 'lucide-react';
import { createResourceApi } from '../services/resource';
import api from '../services/api';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import ProgressBar from '../components/common/ProgressBar';

const progressApi = createResourceApi('/progress');

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed', 'Delayed'];

const emptyForm = {
  productionPlanId: '',
  plannedQuantity: '',
  completedQuantity: '',
  rejectedQuantity: '',
  status: 'Not Started',
  startTime: '',
  endTime: '',
  remarks: '',
};

// datetime-local expects 'YYYY-MM-DDTHH:mm'
const toDateTimeLocal = (isoString) => (isoString ? isoString.slice(0, 16) : '');

function ManufacturingProgress() {
  const [records, setRecords] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const json = await progressApi.list(params);
      setRecords(json.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load progress records');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await api.get('/productionplans');
      if (res.data.success) setPlans(res.data.data);
    } catch {
      // Non-fatal — dropdown just stays empty.
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingId(record._id);
    setForm({
      productionPlanId: record.productionPlanId?._id || '',
      plannedQuantity: record.plannedQuantity ?? '',
      completedQuantity: record.completedQuantity ?? '',
      rejectedQuantity: record.rejectedQuantity ?? '',
      status: record.status || 'Not Started',
      startTime: toDateTimeLocal(record.startTime),
      endTime: toDateTimeLocal(record.endTime),
      remarks: record.remarks || '',
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

  // When picking a production plan on create, prefill planned quantity from it.
  const handlePlanSelect = (e) => {
    const planId = e.target.value;
    const plan = plans.find((p) => p._id === planId);
    setForm((prev) => ({
      ...prev,
      productionPlanId: planId,
      plannedQuantity: plan ? plan.plannedQuantity : prev.plannedQuantity,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (Number(form.completedQuantity) < 0 || Number(form.rejectedQuantity) < 0) {
      setFormError('Quantities cannot be negative.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        plannedQuantity: Number(form.plannedQuantity),
        completedQuantity: Number(form.completedQuantity) || 0,
        rejectedQuantity: Number(form.rejectedQuantity) || 0,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
      };

      if (editingId) {
        await progressApi.update(editingId, payload);
      } else {
        await progressApi.create(payload);
      }

      closeModal();
      fetchRecords();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">Manufacturing Progress</h1>
          <p className="page-header-desc">Track completion and performance against each production plan</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={fetchRecords}><RefreshCw size={14} /> Refresh</button>
          <button className="btn btn-primary" onClick={openCreateModal}><Plus size={14} /> New Progress Record</button>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}><AlertCircle size={15} /><span>{error}</span></div>}

      <div className="toolbar">
        <div className="toolbar-left">
          <select className="form-control" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="toolbar-right">
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{records.length} record{records.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Progress ID</th>
              <th>Plan / Product</th>
              <th>Completed / Planned</th>
              <th>Rejected</th>
              <th style={{ minWidth: 140 }}>Progress</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div className="spinner spinner-primary" style={{ width: 18, height: 18, borderWidth: 2 }} /> Loading records...
                </div>
              </td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={7} className="data-table-empty">
                <Activity size={32} style={{ margin: '0 auto 10px', color: 'var(--gray-300)' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No progress records yet</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Add a progress record to start tracking manufacturing.</p>
              </td></tr>
            ) : records.map((r) => (
              <tr key={r._id}>
                <td><span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 12, fontFamily: 'monospace' }}>{r.progressId}</span></td>
                <td>
                  <div style={{ fontWeight: 600 }}>{r.productionPlanId?.productId?.productName || '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{r.productionPlanId?.planId}</div>
                </td>
                <td>
                  <span style={{ fontWeight: 700 }}>{r.completedQuantity}</span>
                  <span style={{ color: 'var(--text-muted)' }}> / {r.plannedQuantity}</span>
                </td>
                <td style={{ color: r.rejectedQuantity > 0 ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: r.rejectedQuantity > 0 ? 600 : 400 }}>
                  {r.rejectedQuantity}
                </td>
                <td>
                  <div style={{ minWidth: 120 }}>
                    <ProgressBar value={r.progressPercentage || 0} max={100} showLabel />
                  </div>
                </td>
                <td><StatusBadge status={r.status} /></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(r)} style={{ padding: '5px 10px' }}>
                    <Edit2 size={13} /> Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Update Progress Record' : 'New Progress Record'}
        footer={<>
          <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</> : (editingId ? 'Save Changes' : 'Create Record')}
          </button>
        </>}
      >
        {formError && <div className="alert alert-danger" style={{ marginBottom: 14 }}><AlertCircle size={14} /><span>{formError}</span></div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label form-label-required">Production Plan</label>
            <select
              className="form-control"
              name="productionPlanId"
              value={form.productionPlanId}
              onChange={handlePlanSelect}
              required
              disabled={!!editingId}
            >
              <option value="">Select production plan...</option>
              {plans.map((p) => <option key={p._id} value={p._id}>{p.planId} — {p.productId?.productName}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label form-label-required">Planned Qty</label>
              <input className="form-control" type="number" name="plannedQuantity" value={form.plannedQuantity} onChange={handleChange} min="0" required />
            </div>
            <div className="form-group">
              <label className="form-label">Completed Qty</label>
              <input className="form-control" type="number" name="completedQuantity" value={form.completedQuantity} onChange={handleChange} min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Rejected Qty</label>
              <input className="form-control" type="number" name="rejectedQuantity" value={form.rejectedQuantity} onChange={handleChange} min="0" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" name="status" value={form.status} onChange={handleChange}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input className="form-control" type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input className="form-control" type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Remarks</label>
            <textarea className="form-control" name="remarks" value={form.remarks} onChange={handleChange} rows={2} placeholder="Optional remarks..." />
          </div>
          {form.status === 'Completed' && (
            <div className="alert alert-success" style={{ marginTop: 12 }}>
              ✓ Marking Completed will also update the linked production plan status.
            </div>
          )}
          {form.status === 'Delayed' && (
            <div className="alert alert-warning" style={{ marginTop: 12 }}>
              ⚠ Marking Delayed will also flag the linked production plan.
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

export default ManufacturingProgress;

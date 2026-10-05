import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Factory } from 'lucide-react';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import { productionPlansAPI, productsAPI, demandsAPI } from '../services/api';
import { formatDate } from '../utils/formatters';

const EMPTY_FORM = {
  productId: '', demandId: '', plannedQuantity: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '', priority: 'Medium', status: 'Planned', notes: '',
};

const ProductionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, prRes, dRes] = await Promise.all([
        productionPlansAPI.getAll({ status: statusFilter }),
        productsAPI.getAll({ status: 'Active' }),
        demandsAPI.getAll({ status: 'Approved' }),
      ]);
      setPlans(pRes.data.data);
      setProducts(prRes.data.data);
      setDemands(dRes.data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [statusFilter]);

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (p) => {
    setForm({
      productId: p.productId?._id || p.productId,
      demandId: p.demandId?._id || p.demandId || '',
      plannedQuantity: p.plannedQuantity,
      startDate: p.startDate?.split('T')[0],
      endDate: p.endDate?.split('T')[0],
      priority: p.priority, status: p.status, notes: p.notes || '',
    });
    setModal({ open: true, mode: 'edit', data: p });
  };

  const handleSave = async () => {
    if (parseFloat(form.plannedQuantity) < 0) {
      alert('Planned quantity cannot be negative.');
      return;
    }
    setSaving(true);
    try {
      if (modal.mode === 'add') await productionPlansAPI.create(form);
      else await productionPlansAPI.update(modal.data._id, form);
      setModal({ open: false }); fetchAll();
    } catch (err) { alert(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try { await productionPlansAPI.delete(id); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div className="page-header">
        <div><h2>Production Plans</h2><p>Schedule and manage manufacturing runs</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Plan</button>
      </div>

      <div className="page-actions">
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {['Planned', 'Scheduled', 'In Progress', 'Completed', 'Delayed', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Plan ID</th><th>Product</th><th>Demand</th><th>Qty</th>
                <th>Start</th><th>End</th><th>Priority</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : plans.length === 0 ? (
                <tr><td colSpan="9"><div className="empty-state"><Factory size={32} /><p>No production plans</p></div></td></tr>
              ) : plans.map((p) => (
                <tr key={p._id}>
                  <td><code style={{ fontSize: 11, color: 'var(--primary-light)' }}>{p.planId}</code></td>
                  <td style={{ fontWeight: 600 }}>{p.productId?.productName || '—'}</td>
                  <td>{p.demandId?.demandId || '—'}</td>
                  <td>{p.plannedQuantity}</td>
                  <td>{formatDate(p.startDate)}</td>
                  <td>{formatDate(p.endDate)}</td>
                  <td><StatusBadge value={p.priority} /></td>
                  <td><StatusBadge value={p.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(p)}><Edit2 size={14} /></button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(p._id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-meta"><span>{plans.length} plan(s)</span></div>
      </div>

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.mode === 'add' ? 'Add Production Plan' : 'Edit Production Plan'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal({ open: false })}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Product *</label>
            <select className="form-control" value={form.productId} onChange={f('productId')}>
              <option value="">Select product...</option>
              {products.map((p) => <option key={p._id} value={p._id}>{p.productName}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Linked Demand</label>
            <select className="form-control" value={form.demandId} onChange={f('demandId')}>
              <option value="">None</option>
              {demands.map((d) => <option key={d._id} value={d._id}>{d.demandId} — {d.customerName}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Planned Qty</label>
            <input className="form-control" type="number" min="0" value={form.plannedQuantity} onChange={f('plannedQuantity')} placeholder="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input className="form-control" type="date" value={form.startDate} onChange={f('startDate')} />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input className="form-control" type="date" value={form.endDate} onChange={f('endDate')} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-control" value={form.priority} onChange={f('priority')}>
              {['Low', 'Medium', 'High', 'Urgent'].map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={form.status} onChange={f('status')}>
              {['Planned', 'Scheduled', 'In Progress', 'Completed', 'Delayed', 'Cancelled'].map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-control" value={form.notes} onChange={f('notes')} placeholder="Optional notes..." />
        </div>
      </Modal>
    </div>
  );
};

export default ProductionPlans;

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, ClipboardList } from 'lucide-react';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import { demandsAPI, productsAPI } from '../services/api';
import { formatDate } from '../utils/formatters';

const EMPTY_FORM = {
  productId: '', customerName: '', quantity: '',
  demandDate: new Date().toISOString().split('T')[0],
  dueDate: '', priority: 'Medium', status: 'Pending', notes: '',
};

const Demands = () => {
  const [demands, setDemands] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchDemands = async () => {
    setLoading(true);
    try {
      const [dRes, pRes] = await Promise.all([
        demandsAPI.getAll({ search, status: statusFilter, priority: priorityFilter }),
        productsAPI.getAll({ status: 'Active' }),
      ]);
      setDemands(dRes.data.data);
      setProducts(pRes.data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchDemands(); }, [search, statusFilter, priorityFilter]);

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (d) => {
    setForm({
      productId: d.productId?._id || d.productId,
      customerName: d.customerName, quantity: d.quantity,
      demandDate: d.demandDate?.split('T')[0],
      dueDate: d.dueDate?.split('T')[0],
      priority: d.priority, status: d.status, notes: d.notes || '',
    });
    setModal({ open: true, mode: 'edit', data: d });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal.mode === 'add') await demandsAPI.create(form);
      else await demandsAPI.update(modal.data._id, form);
      setModal({ open: false });
      fetchDemands();
    } catch (err) { alert(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this demand?')) return;
    try { await demandsAPI.delete(id); fetchDemands(); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div className="page-header">
        <div><h2>Demands</h2><p>Manage customer demand orders</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Demand</button>
      </div>

      <div className="page-actions">
        <div className="search-input-wrapper">
          <Search size={15} />
          <input className="search-input" placeholder="Search customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {['Pending', 'Approved', 'In Production', 'Completed', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="filter-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All Priority</option>
          {['Low', 'Medium', 'High', 'Urgent'].map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Product</th><th>Customer</th><th>Qty</th>
                <th>Due Date</th><th>Priority</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : demands.length === 0 ? (
                <tr><td colSpan="8"><div className="empty-state"><ClipboardList size={32} /><p>No demands found</p></div></td></tr>
              ) : demands.map((d) => (
                <tr key={d._id}>
                  <td><code style={{ fontSize: 11, color: 'var(--primary-light)' }}>{d.demandId}</code></td>
                  <td>{d.productId?.productName || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{d.customerName}</td>
                  <td>{d.quantity}</td>
                  <td>{formatDate(d.dueDate)}</td>
                  <td><StatusBadge value={d.priority} /></td>
                  <td><StatusBadge value={d.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(d)}><Edit2 size={14} /></button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(d._id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-meta"><span>{demands.length} demand(s)</span></div>
      </div>

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.mode === 'add' ? 'Add New Demand' : 'Edit Demand'}
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
            <label className="form-label">Customer Name *</label>
            <input className="form-control" value={form.customerName} onChange={f('customerName')} placeholder="Customer name" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Quantity *</label>
            <input className="form-control" type="number" value={form.quantity} onChange={f('quantity')} placeholder="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Demand Date</label>
            <input className="form-control" type="date" value={form.demandDate} onChange={f('demandDate')} />
          </div>
          <div className="form-group">
            <label className="form-label">Due Date *</label>
            <input className="form-control" type="date" value={form.dueDate} onChange={f('dueDate')} />
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
              {['Pending', 'Approved', 'In Production', 'Completed', 'Cancelled'].map((v) => <option key={v}>{v}</option>)}
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

export default Demands;

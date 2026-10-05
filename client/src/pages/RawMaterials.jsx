import { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Search, FlaskConical, AlertTriangle,
  Package, CheckCircle, XCircle, RefreshCw,
} from 'lucide-react';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import ProgressBar from '../components/common/ProgressBar';
import StatCard from '../components/common/StatCard';
import { rawMaterialsAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const EMPTY_FORM = {
  materialName: '', category: '', unit: 'kg',
  currentStock: '', minimumStock: '', maximumStock: '',
  reorderLevel: '', supplier: '', unitCost: '',
};

const RawMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await rawMaterialsAPI.getAll({ search, status: statusFilter });
      setMaterials(res.data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchMaterials(); }, [search, statusFilter]);

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (m) => {
    setForm({
      materialName: m.materialName, category: m.category || '', unit: m.unit,
      currentStock: m.currentStock, minimumStock: m.minimumStock, maximumStock: m.maximumStock,
      reorderLevel: m.reorderLevel, supplier: m.supplier || '', unitCost: m.unitCost,
    });
    setModal({ open: true, mode: 'edit', data: m });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal.mode === 'add') await rawMaterialsAPI.create(form);
      else await rawMaterialsAPI.update(modal.data._id, form);
      setModal({ open: false }); fetchMaterials();
    } catch (err) { alert(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try { await rawMaterialsAPI.delete(id); fetchMaterials(); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const stockPct = (m) => m.maximumStock > 0 ? Math.round((m.currentStock / m.maximumStock) * 100) : 0;

  const totalMaterials = materials.length;
  const inStock = materials.filter((m) => m.status === 'Available').length;
  const lowStock = materials.filter((m) => m.status === 'Low Stock').length;
  const outOfStock = materials.filter((m) => m.status === 'Out of Stock').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">Raw Materials</h1>
          <p className="page-header-desc">Manage raw material stock, availability and reorder levels.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={fetchMaterials}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={14} /> Add Raw Material
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <StatCard label="Total Materials" value={totalMaterials} icon={<Package size={22} />} color="blue" trend="All registered materials" />
        <StatCard label="In Stock" value={inStock} icon={<CheckCircle size={22} />} color="green" trend="Sufficient stock level" />
        <StatCard label="Low Stock" value={lowStock} icon={<AlertTriangle size={22} />} color="yellow" trend="Below reorder level" />
        <StatCard label="Out of Stock" value={outOfStock} icon={<XCircle size={22} />} color="red" trend="Requires immediate action" />
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar" style={{ flex: 1, maxWidth: 360 }}>
            <Search size={15} className="search-bar-icon" />
            <input placeholder="Search by name, code, category..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ width: 'auto', minWidth: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {['Available', 'Low Stock', 'Out of Stock'].map((s) => <option key={s}>{s}</option>)}
          </select>
          {(search || statusFilter) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setStatusFilter(''); }}>Clear filters</button>
          )}
        </div>
        <div className="toolbar-right">
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{materials.length} material{materials.length !== 1 ? 's' : ''}</span>
          {outOfStock + lowStock > 0 && (
            <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={12} /> {outOfStock + lowStock} need attention
            </span>
          )}
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Material Code</th><th>Material Name</th><th>Category</th><th>Unit</th>
              <th style={{ minWidth: 180 }}>Stock Level</th><th>Reorder Level</th>
              <th>Unit Cost</th><th>Supplier</th><th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '48px 20px', color: 'var(--text-muted)' }}>
                  <div className="spinner spinner-primary" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  Loading materials...
                </div>
              </td></tr>
            ) : materials.length === 0 ? (
              <tr><td colSpan="10">
                <div className="empty-state">
                  <div className="empty-state-icon"><FlaskConical size={28} /></div>
                  <div className="empty-state-title">No materials found</div>
                  <div className="empty-state-text">
                    {search || statusFilter ? 'Try adjusting your search or filter criteria.' : 'Add your first raw material to get started.'}
                  </div>
                  {!search && !statusFilter && (
                    <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={13} /> Add First Material</button>
                  )}
                </div>
              </td></tr>
            ) : materials.map((m) => {
              const pct = stockPct(m);
              const isLow = m.currentStock <= m.reorderLevel;
              return (
                <tr key={m._id}>
                  <td>
                    <code style={{ fontSize: 11.5, color: 'var(--primary)', background: 'var(--primary-50)', padding: '2px 7px', borderRadius: 'var(--radius-xs)', fontWeight: 600 }}>
                      {m.materialId}
                    </code>
                  </td>
                  <td><span style={{ fontWeight: 600 }}>{m.materialName}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{m.category || '—'}</td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 'var(--radius-xs)' }}>
                      {m.unit}
                    </span>
                  </td>
                  <td style={{ minWidth: 180 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isLow ? 'var(--danger)' : 'var(--text-primary)' }}>{m.currentStock}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ {m.maximumStock} {m.unit}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: isLow ? 'var(--danger)' : 'var(--text-secondary)' }}>{pct}%</span>
                    </div>
                    <ProgressBar value={pct} max={100} showLabel={false} size="sm" />
                  </td>
                  <td>
                    <span style={{ color: isLow ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: isLow ? 700 : 400 }}>
                      {m.reorderLevel} {m.unit}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(m.unitCost)}/{m.unit}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{m.supplier || '—'}</td>
                  <td><StatusBadge value={m.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(m)} style={{ padding: '5px 10px' }}>
                        <Edit2 size={13} /> Edit
                      </button>
                      <button className="btn btn-sm" onClick={() => handleDelete(m._id)} style={{ padding: '5px 10px', background: 'var(--danger-50)', color: 'var(--danger)', border: '1px solid var(--danger-light)' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && materials.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', background: 'var(--gray-50)', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>{materials.length} material(s) shown</span>
            <span>Stock status updates automatically on inventory transactions</span>
          </div>
        )}
      </div>

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.mode === 'add' ? 'Add Raw Material' : 'Edit Raw Material'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal({ open: false })}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</> : (modal.mode === 'add' ? 'Add Material' : 'Save Changes')}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label form-label-required">Material Name</label>
            <input className="form-control" value={form.materialName} onChange={f('materialName')} placeholder="e.g. Wheat Flour" />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <input className="form-control" value={form.category} onChange={f('category')} placeholder="e.g. Flour, Dairy" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label form-label-required">Unit</label>
            <input className="form-control" value={form.unit} onChange={f('unit')} placeholder="kg, units, litres" />
          </div>
          <div className="form-group">
            <label className="form-label">Unit Cost (₹)</label>
            <input className="form-control" type="number" value={form.unitCost} onChange={f('unitCost')} placeholder="0.00" />
          </div>
          <div className="form-group">
            <label className="form-label">Supplier</label>
            <input className="form-control" value={form.supplier} onChange={f('supplier')} placeholder="Supplier name" />
          </div>
        </div>
        <div style={{ height: 1, background: 'var(--border-light)', margin: '4px 0 16px' }} />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Stock Levels</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Current Stock</label>
            <input className="form-control" type="number" value={form.currentStock} onChange={f('currentStock')} placeholder="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Minimum Stock</label>
            <input className="form-control" type="number" value={form.minimumStock} onChange={f('minimumStock')} placeholder="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Maximum Stock</label>
            <input className="form-control" type="number" value={form.maximumStock} onChange={f('maximumStock')} placeholder="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Reorder Level</label>
            <input className="form-control" type="number" value={form.reorderLevel} onChange={f('reorderLevel')} placeholder="0" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RawMaterials;

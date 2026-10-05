import React, { useState, useEffect, useCallback } from 'react';
import { ScrollText, Plus, Edit2, Trash2, AlertCircle, RefreshCw, Calculator } from 'lucide-react';
import { createResourceApi } from '../services/resource';
import api from '../services/api';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatusBadge from '../components/common/StatusBadge';

const bomApi = createResourceApi('/bom');

const emptyForm = {
  productId: '',
  materialId: '',
  quantityPerUnit: '',
  unit: 'kg',
};

function BOM() {
  const [tab, setTab] = useState('entries'); // 'entries' | 'requirements'

  // --- Shared lookups ---
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);

  // --- Entries tab ---
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productFilter, setProductFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // --- Requirements tab ---
  const [reqProductId, setReqProductId] = useState('');
  const [reqQuantity, setReqQuantity] = useState(1);
  const [reqResult, setReqResult] = useState(null);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState('');

  const fetchBoms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (productFilter) params.productId = productFilter;
      const json = await bomApi.list(params);
      setBoms(json.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load BOM entries');
    } finally {
      setLoading(false);
    }
  }, [productFilter]);

  const fetchLookups = useCallback(async () => {
    try {
      const [prodRes, matRes] = await Promise.all([
        api.get('/products'),
        api.get('/rawmaterials'),
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (matRes.data.success) setMaterials(matRes.data.data);
    } catch {
      // Non-fatal â€” dropdowns just stay empty.
    }
  }, []);

  useEffect(() => { fetchBoms(); }, [fetchBoms]);
  useEffect(() => { fetchLookups(); }, [fetchLookups]);

  // --- Entry CRUD ---
  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (bom) => {
    setEditingId(bom._id);
    setForm({
      productId: bom.productId?._id || '',
      materialId: bom.materialId?._id || '',
      quantityPerUnit: bom.quantityPerUnit ?? '',
      unit: bom.unit || 'kg',
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

    if (Number(form.quantityPerUnit) <= 0) {
      setFormError('Quantity per unit must be positive.');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, quantityPerUnit: Number(form.quantityPerUnit) };
      if (editingId) {
        await bomApi.update(editingId, payload);
      } else {
        await bomApi.create(payload);
      }
      closeModal();
      fetchBoms();
    } catch (err) {
      // Duplicate productId+materialId pair hits the unique index -> Mongo E11000 error
      const msg = err.response?.data?.message
        || (err.response?.status === 500 ? 'This material is already in the BOM for this product.' : 'Save failed');
      setFormError(msg);
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
      setError(err.response?.data?.message || 'Delete failed');
      setDeleteTarget(null);
    }
  };

  // --- Requirements calculator ---
  const handleCalculate = async (e) => {
    e.preventDefault();
    setReqError('');
    setReqResult(null);
    if (!reqProductId) {
      setReqError('Select a product first.');
      return;
    }
    setReqLoading(true);
    try {
      const res = await api.get(`/bom/product/${reqProductId}/requirements`, {
        params: { quantity: reqQuantity },
      });
      setReqResult(res.data);
    } catch (err) {
      setReqError(err.response?.data?.message || 'Failed to calculate requirements');
    } finally {
      setReqLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">Bill of Materials</h1>
          <p className="page-header-desc">Define material composition per product and calculate production requirements</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={fetchBoms}><RefreshCw size={14} /> Refresh</button>
          {tab === 'entries' && (
            <button className="btn btn-primary" onClick={openCreateModal}><Plus size={14} /> New BOM Entry</button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {[{ key: 'entries', label: 'BOM Entries', icon: ScrollText }, { key: 'requirements', label: 'Requirements Calculator', icon: Calculator }].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 18px',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === key ? 'var(--primary)' : 'transparent'}`,
              marginBottom: '-2px',
              color: tab === key ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: tab === key ? 700 : 500,
              fontSize: 13.5,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'entries' ? (
        <>
          {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}><AlertCircle size={15} /><span>{error}</span></div>}

          <div className="toolbar">
            <div className="toolbar-left">
              <select className="form-control" style={{ width: 'auto' }} value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
                <option value="">All Products</option>
                {products.map((p) => <option key={p._id} value={p._id}>{p.productName}</option>)}
              </select>
            </div>
            <div className="toolbar-right">
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{boms.length} entr{boms.length !== 1 ? 'ies' : 'y'}</span>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>BOM ID</th>
                  <th>Product</th>
                  <th>Raw Material</th>
                  <th>Qty / Unit Produced</th>
                  <th>Material Stock</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <div className="spinner spinner-primary" style={{ width: 18, height: 18, borderWidth: 2 }} /> Loading BOM entries...
                    </div>
                  </td></tr>
                ) : boms.length === 0 ? (
                  <tr><td colSpan={6} className="data-table-empty">
                    <ScrollText size={32} style={{ margin: '0 auto 10px', color: 'var(--gray-300)' }} />
                    <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No BOM entries yet</p>
                    <p style={{ fontSize: 12, marginTop: 4 }}>Click "New BOM Entry" to define material requirements.</p>
                  </td></tr>
                ) : boms.map((bom) => (
                  <tr key={bom._id}>
                    <td><span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 12, fontFamily: 'monospace' }}>{bom.bomId}</span></td>
                    <td style={{ fontWeight: 600 }}>{bom.productId?.productName || 'â€”'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{bom.materialId?.materialName || 'â€”'}</td>
                    <td><strong>{bom.quantityPerUnit}</strong> {bom.unit}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{bom.materialId?.currentStock ?? 'â€”'}</span>{' '}
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{bom.materialId?.unit}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(bom)} style={{ padding: '5px 10px' }}><Edit2 size={13} /> Edit</button>
                        <button className="btn btn-sm" onClick={() => setDeleteTarget(bom)} style={{ padding: '5px 10px', background: 'var(--danger-50)', color: 'var(--danger)', border: '1px solid var(--danger-light)' }}><Trash2 size={13} /> Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Material Requirements Calculator</div>
              <div className="card-subtitle">Calculate how much raw material is needed to produce a given quantity</div>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleCalculate} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 24 }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <label className="form-label">Product</label>
                <select className="form-control" value={reqProductId} onChange={(e) => setReqProductId(e.target.value)}>
                  <option value="">Select product...</option>
                  {products.map((p) => <option key={p._id} value={p._id}>{p.productName}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label className="form-label">Planned Production Quantity</label>
                <input className="form-control" type="number" value={reqQuantity} onChange={(e) => setReqQuantity(e.target.value)} min="1" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={reqLoading}>
                <Calculator size={14} /> {reqLoading ? 'Calculating...' : 'Calculate'}
              </button>
            </form>

            {reqError && <div className="alert alert-danger" style={{ marginBottom: 16 }}><AlertCircle size={15} /><span>{reqError}</span></div>}

            {reqResult && (
              <>
                <div className={`alert ${reqResult.summary.allMaterialsSufficient ? 'alert-success' : 'alert-warning'}`} style={{ marginBottom: 16 }}>
                  {reqResult.summary.allMaterialsSufficient
                    ? `âœ“ All ${reqResult.summary.totalMaterials} materials have sufficient stock for ${reqResult.productionQuantity} units.`
                    : `âš  ${reqResult.summary.materialsWithShortage} of ${reqResult.summary.totalMaterials} materials are short for ${reqResult.productionQuantity} units.`}
                </div>

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th>Required</th>
                        <th>Available</th>
                        <th>Shortage</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reqResult.data.map((r) => (
                        <tr key={r.materialId}>
                          <td>
                            <span style={{ fontWeight: 600 }}>{r.materialName}</span>{' '}
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({r.materialCode})</span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{r.requiredQuantity} {r.unit}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{r.availableStock} {r.unit}</td>
                          <td style={{ color: r.shortage > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: r.shortage > 0 ? 700 : 400 }}>
                            {r.shortage > 0 ? `${r.shortage} ${r.unit}` : 'â€”'}
                          </td>
                          <td>
                            <span className={`badge ${r.isSufficient ? 'badge-green' : 'badge-red'}`}>
                              {r.isSufficient ? 'Sufficient' : 'Shortfall'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Edit BOM Entry' : 'New BOM Entry'}
        footer={<>
          <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</> : (editingId ? 'Save Changes' : 'Create Entry')}
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
            <label className="form-label form-label-required">Raw Material</label>
            <select className="form-control" name="materialId" value={form.materialId} onChange={handleChange} required>
              <option value="">Select material...</option>
              {materials.map((m) => <option key={m._id} value={m._id}>{m.materialName}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label form-label-required">Qty per Unit Produced</label>
              <input className="form-control" type="number" name="quantityPerUnit" value={form.quantityPerUnit} onChange={handleChange} min="0.0001" step="0.0001" required placeholder="0.0" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Unit</label>
              <input className="form-control" type="text" name="unit" value={form.unit} onChange={handleChange} placeholder="kg, litres..." />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete BOM Entry?"
        message={`This will remove "${deleteTarget?.materialId?.materialName || 'this material'}" from "${deleteTarget?.productId?.productName || 'this product'}"'s BOM. This cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default BOM;

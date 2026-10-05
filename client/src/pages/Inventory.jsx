import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, SlidersHorizontal, Plus, Search,
  Filter, RefreshCw, AlertCircle, Package, CheckCircle, AlertTriangle,
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/common/Modal';
import StatCard from '../components/common/StatCard';
import { formatDateTime } from '../utils/formatters';

const TXN_TYPES = ['IN', 'OUT', 'ADJUSTMENT'];

const emptyTxnForm = {
  materialId: '',
  transactionType: 'IN',
  quantity: '',
  reference: '',
  remarks: '',
};

// Transaction type config
const TXN_CONFIG = {
  IN: { label: 'IN', badgeClass: 'badge-green', sign: '+', color: 'var(--success)', btnActive: 'background:var(--success);color:white;border-color:var(--success)' },
  OUT: { label: 'OUT', badgeClass: 'badge-yellow', sign: '−', color: 'var(--warning)', btnActive: 'background:var(--warning);color:white;border-color:var(--warning)' },
  ADJUSTMENT: { label: 'ADJ', badgeClass: 'badge-purple', sign: '=', color: 'var(--purple)', btnActive: 'background:var(--purple);color:white;border-color:var(--purple)' },
};

function Inventory() {
  const [transactions, setTransactions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [materialFilter, setMaterialFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyTxnForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await api.get('/raw-materials');
      if (res.data.success) setMaterials(res.data.data);
    } catch (err) {
      console.error('Failed to load raw materials for dropdown', err);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (materialFilter) params.materialId = materialFilter;
      if (typeFilter) params.transactionType = typeFilter;
      const res = await api.get('/inventory', { params });
      if (res.data.success) setTransactions(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory transactions');
    } finally {
      setLoading(false);
    }
  }, [materialFilter, typeFilter]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const selectedMaterial = materials.find((m) => m._id === form.materialId);

  const handleOpenModal = () => {
    setForm(emptyTxnForm);
    setFormError('');
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.materialId) { setFormError('Please select a raw material'); return; }
    const qty = parseFloat(form.quantity);
    if (isNaN(qty) || qty <= 0) { setFormError('Quantity must be greater than zero'); return; }
    if (form.transactionType === 'OUT' && selectedMaterial && qty > selectedMaterial.currentStock) {
      setFormError(`Insufficient stock. Current stock is ${selectedMaterial.currentStock} ${selectedMaterial.unit}`);
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await api.post('/inventory', { ...form, quantity: qty });
      setModalOpen(false);
      fetchTransactions();
      fetchMaterials();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record transaction');
    } finally {
      setSaving(false);
    }
  };

  // Client-side search filter
  const filteredTransactions = transactions.filter((t) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (t.reference?.toLowerCase() || '').includes(term) ||
      (t.remarks?.toLowerCase() || '').includes(term) ||
      (t.materialId?.materialName?.toLowerCase() || '').includes(term) ||
      (t.inventoryId?.toLowerCase() || '').includes(term)
    );
  });

  // Summary stats from existing data
  const totalTxns = transactions.length;
  const totalIn = transactions.filter((t) => t.transactionType === 'IN').length;
  const totalOut = transactions.filter((t) => t.transactionType === 'OUT').length;
  const totalAdj = transactions.filter((t) => t.transactionType === 'ADJUSTMENT').length;
  const lowStockCount = materials.filter((m) => m.status === 'Low Stock' || m.status === 'Out of Stock').length;

  const hasFilters = search || typeFilter || materialFilter;

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">Inventory</h1>
          <p className="page-header-desc">Monitor stock levels and track inventory transactions.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => { fetchTransactions(); fetchMaterials(); }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <Plus size={14} /> Record Transaction
          </button>
        </div>
      </div>

      {/* ── Summary Stat Cards ── */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <StatCard label="Total Transactions" value={totalTxns} icon={<Package size={22} />} color="blue" trend="All time records" />
        <StatCard label="Stock Inward (IN)" value={totalIn} icon={<ArrowDownLeft size={22} />} color="green" trend="Received into stock" />
        <StatCard label="Stock Outward (OUT)" value={totalOut} icon={<ArrowUpRight size={22} />} color="yellow" trend="Issued from stock" />
        <StatCard label="Adjustments" value={totalAdj} icon={<SlidersHorizontal size={22} />} color="purple" trend="Manual corrections" />
        <StatCard label="Low / Out of Stock" value={lowStockCount} icon={<AlertTriangle size={22} />} color="red" trend="Materials needing action" />
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar" style={{ flex: 1, maxWidth: 380 }}>
            <Search size={15} className="search-bar-icon" />
            <input
              placeholder="Search by ID, material, reference, remarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <select className="form-control" style={{ width: 'auto' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {TXN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <select className="form-control" style={{ width: 'auto', maxWidth: 200 }} value={materialFilter} onChange={(e) => setMaterialFilter(e.target.value)}>
            <option value="">All Materials</option>
            {materials.map((m) => (
              <option key={m._id} value={m._id}>{m.materialName} ({m.materialId})</option>
            ))}
          </select>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setTypeFilter(''); setMaterialFilter(''); }}>
              Clear filters
            </button>
          )}
        </div>
        <div className="toolbar-right">
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
            {filteredTransactions.length} of {transactions.length} records
          </span>
        </div>
      </div>

      {/* ── Error State ── */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Transactions Table ── */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Txn ID</th>
              <th>Date &amp; Time</th>
              <th>Raw Material</th>
              <th>Type</th>
              <th style={{ textAlign: 'right' }}>Quantity</th>
              <th style={{ textAlign: 'right' }}>Current Stock</th>
              <th>Reference</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '48px 20px', color: 'var(--text-muted)' }}>
                  <div className="spinner spinner-primary" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  Loading inventory log...
                </div>
              </td></tr>
            ) : filteredTransactions.length === 0 ? (
              <tr><td colSpan="8">
                <div className="empty-state">
                  <div className="empty-state-icon"><Package size={28} /></div>
                  <div className="empty-state-title">No transactions found</div>
                  <div className="empty-state-text">
                    {hasFilters ? 'Try adjusting your search or filter criteria.' : 'Record a stock inward, outward, or adjustment transaction to get started.'}
                  </div>
                  {!hasFilters && (
                    <button className="btn btn-primary btn-sm" onClick={handleOpenModal}><Plus size={13} /> Record First Transaction</button>
                  )}
                </div>
              </td></tr>
            ) : (
              filteredTransactions.map((t) => {
                const cfg = TXN_CONFIG[t.transactionType] || { label: t.transactionType, badgeClass: 'badge-gray', sign: '', color: 'var(--text-muted)' };
                const unit = t.materialId?.unit || '';
                return (
                  <tr key={t._id}>
                    <td>
                      <code style={{ fontSize: 11, color: 'var(--primary)', background: 'var(--primary-50)', padding: '2px 6px', borderRadius: 'var(--radius-xs)', fontWeight: 600 }}>
                        {t.inventoryId}
                      </code>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatDateTime ? formatDateTime(t.transactionDate) : new Date(t.transactionDate).toLocaleString()}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, display: 'block' }}>{t.materialId?.materialName || '—'}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.materialId?.materialId}</span>
                    </td>
                    <td>
                      <span className={`badge ${cfg.badgeClass}`} style={{ gap: 3 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block', flexShrink: 0 }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: cfg.color }}>
                        {cfg.sign} {t.quantity} {unit}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {t.materialId?.currentStock !== undefined ? `${t.materialId.currentStock} ${unit}` : '—'}
                    </td>
                    <td>
                      {t.reference ? (
                        <code style={{ fontSize: 11.5, color: 'var(--text-secondary)', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 'var(--radius-xs)' }}>
                          {t.reference}
                        </code>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 200 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.remarks || '—'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Table footer */}
        {!loading && filteredTransactions.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', background: 'var(--gray-50)', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Showing {filteredTransactions.length} of {transactions.length} records</span>
            <span>Automatic low-stock alerts triggered on stock updates</span>
          </div>
        )}
      </div>

      {/* ── Record Transaction Modal ── */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Record Inventory Transaction"
          size="md"
        >
          <form onSubmit={handleSave}>
            {formError && (
              <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            {/* Raw Material */}
            <div className="form-group">
              <label className="form-label form-label-required">Raw Material</label>
              <select className="form-control" name="materialId" value={form.materialId} onChange={handleFormChange} required>
                <option value="">Select Raw Material</option>
                {materials.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.materialName} ({m.materialId}) — Stock: {m.currentStock} {m.unit}
                  </option>
                ))}
              </select>
              {selectedMaterial && (
                <div className="form-hint" style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                  <span>Current Stock: <strong style={{ color: 'var(--text-primary)' }}>{selectedMaterial.currentStock} {selectedMaterial.unit}</strong></span>
                  <span>Reorder Level: {selectedMaterial.reorderLevel} {selectedMaterial.unit}</span>
                </div>
              )}
            </div>

            {/* Transaction Type */}
            <div className="form-group">
              <label className="form-label form-label-required">Transaction Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                {TXN_TYPES.map((type) => {
                  const cfg = TXN_CONFIG[type];
                  const isSelected = form.transactionType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, transactionType: type }))}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 'var(--radius)',
                        border: `1.5px solid ${isSelected ? cfg.color : 'var(--border)'}`,
                        background: isSelected ? cfg.color : 'white',
                        color: isSelected ? 'white' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: 12.5,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontFamily: 'inherit',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <span style={{ fontSize: 15 }}>
                        {type === 'IN' ? '↓' : type === 'OUT' ? '↑' : '⇔'}
                      </span>
                      {type === 'IN' ? 'IN (Receive)' : type === 'OUT' ? 'OUT (Issue)' : 'ADJUSTMENT'}
                    </button>
                  );
                })}
              </div>
              <p className="form-hint">
                {form.transactionType === 'IN' && 'Increases current stock of the material.'}
                {form.transactionType === 'OUT' && 'Decreases current stock. Insufficient stock will be blocked.'}
                {form.transactionType === 'ADJUSTMENT' && 'Sets stock to absolute target quantity.'}
              </p>
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label className="form-label form-label-required">
                Quantity ({selectedMaterial?.unit || 'units'})
              </label>
              <input
                className="form-control"
                type="number"
                step="any"
                min="0.001"
                name="quantity"
                value={form.quantity}
                onChange={handleFormChange}
                placeholder="e.g. 50"
                required
              />
            </div>

            {/* Reference + Remarks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Reference / PO</label>
                <input
                  className="form-control"
                  type="text"
                  name="reference"
                  value={form.reference}
                  onChange={handleFormChange}
                  placeholder="e.g. PO-2024-001"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Remarks / Notes</label>
                <input
                  className="form-control"
                  type="text"
                  name="remarks"
                  value={form.remarks}
                  onChange={handleFormChange}
                  placeholder="Optional notes..."
                />
              </div>
            </div>

            {/* Footer actions inside form */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border-light)', marginTop: 4 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Recording...</> : 'Submit Transaction'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default Inventory;

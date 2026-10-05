import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, AlertTriangle, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../services/api';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatusBadge from '../components/common/StatusBadge';

const SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const TYPE_OPTIONS = ['LOW_STOCK', 'MATERIAL_SHORTAGE', 'PRODUCTION_DELAY', 'PENDING_DEMAND', 'PRODUCTION_COMPLETED'];

const TYPE_ICONS = {
  LOW_STOCK: '📉',
  MATERIAL_SHORTAGE: '⚠️',
  PRODUCTION_DELAY: '⏱️',
  PENDING_DEMAND: '📥',
  PRODUCTION_COMPLETED: '✅',
};

const SEVERITY_BORDER = {
  Critical: 'var(--danger)',
  High:     'var(--warning)',
  Medium:   'var(--primary)',
  Low:      'var(--gray-300)',
};

function formatType(type) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (readFilter) params.isRead = readFilter;
      if (severityFilter) params.severity = severityFilter;
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/alerts', { params });
      if (res.data.success) {
        setAlerts(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [readFilter, severityFilter, typeFilter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleMarkRead = async (id) => {
    try { await api.put(`/alerts/${id}/read`); fetchAlerts(); }
    catch (err) { setError(err.response?.data?.message || 'Failed to mark as read'); }
  };

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true);
    try { await api.put('/alerts/mark-all-read'); fetchAlerts(); }
    catch (err) { setError(err.response?.data?.message || 'Failed to mark all as read'); }
    finally { setMarkingAllRead(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/alerts/${deleteTarget._id}`); setDeleteTarget(null); fetchAlerts(); }
    catch (err) { setError(err.response?.data?.message || 'Delete failed'); setDeleteTarget(null); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-header-title">System Alerts</h1>
            {unreadCount > 0 && (
              <span style={{
                background: 'var(--danger)', color: 'white',
                fontSize: 11, fontWeight: 700, padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}>
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="page-header-desc">System notifications for stock, demand, and production events</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={fetchAlerts}><RefreshCw size={14} /> Refresh</button>
          <button
            className="btn btn-secondary"
            onClick={handleMarkAllRead}
            disabled={markingAllRead || unreadCount === 0}
          >
            <CheckCheck size={14} /> {markingAllRead ? 'Marking...' : 'Mark All Read'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}><AlertCircle size={15} /><span>{error}</span></div>}

      <div className="toolbar">
        <div className="toolbar-left">
          <select className="form-control" style={{ width: 'auto' }} value={readFilter} onChange={(e) => setReadFilter(e.target.value)}>
            <option value="">All Alerts</option>
            <option value="false">Unread Only</option>
            <option value="true">Read Only</option>
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="">All Severities</option>
            {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{formatType(t)}</option>)}
          </select>
        </div>
        <div className="toolbar-right">
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div className="loading-page">
            <div className="spinner spinner-primary" style={{ width: 28, height: 28, borderWidth: 2.5 }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading alerts...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Bell size={28} /></div>
            <div className="empty-state-title">No alerts</div>
            <div className="empty-state-text">
              {readFilter || severityFilter || typeFilter ? 'No alerts match your filters.' : 'All systems are running smoothly.'}
            </div>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert._id}
              style={{
                background: 'white',
                borderRadius: 'var(--radius-md)',
                border: `1px solid var(--border)`,
                borderLeft: `4px solid ${SEVERITY_BORDER[alert.severity] || 'var(--gray-300)'}`,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                boxShadow: 'var(--shadow-xs)',
                opacity: alert.isRead ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <div style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>
                {TYPE_ICONS[alert.type] || '🔔'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>{alert.title}</span>
                  <StatusBadge status={alert.severity} />
                  {!alert.isRead && (
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{alert.message}</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>
                  {formatType(alert.type)} · {timeAgo(alert.createdAt)}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                {!alert.isRead && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleMarkRead(alert._id)}
                    style={{ fontSize: 11.5 }}
                  >
                    <CheckCheck size={12} /> Mark Read
                  </button>
                )}
                <button
                  className="btn btn-sm"
                  onClick={() => setDeleteTarget(alert)}
                  style={{ fontSize: 11.5, background: 'var(--danger-50)', color: 'var(--danger)', border: '1px solid var(--danger-light)' }}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Alert?"
        message={`This will permanently delete "${deleteTarget?.title}". This action cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default Alerts;

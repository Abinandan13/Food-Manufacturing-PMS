import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Reusable confirm/delete dialog with the new CSS design system.
 */
function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Delete', onCancel, onConfirm, danger = true }) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
    >
      <div
        className="modal-box"
        style={{ maxWidth: '400px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius)',
              background: 'var(--danger-50)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
            </div>
            <h2 className="modal-title">{title}</h2>
          </div>
          <button className="modal-close" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body" style={{ paddingTop: 16, paddingBottom: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable modal dialog.
 * Usage:
 *   <Modal isOpen={isOpen} onClose={onClose} title="Edit Product" size="lg">
 *     ... body ...
 *   </Modal>
 */
function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthMap = {
    sm: '440px',
    md: '560px',
    lg: '720px',
    xl: '900px',
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-box"
        style={{ maxWidth: maxWidthMap[size] || maxWidthMap.md }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;

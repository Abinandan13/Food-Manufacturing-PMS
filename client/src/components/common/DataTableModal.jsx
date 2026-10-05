import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable DataTableModal component.
 * Features:
 * - Centered 90vw (max 1100px), max-height 85vh with sticky table headers
 * - Dim backdrop with smooth fade/scale animation
 * - Close on Escape, X button, and backdrop click
 * - Focus trapping and focus restoration on close
 * - Body scroll locking while open
 * - Full responsive sheet support on mobile
 */
function DataTableModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  triggerRef,
  headerAction,
}) {
  const modalRef = useRef(null);

  // Lock body scroll and restore focus on close
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus first focusable element inside modal
    const focusable = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable && focusable.length > 0) {
      focusable[0].focus();
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      if (triggerRef?.current) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, triggerRef]);

  // Handle Escape key and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="data-table-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="data-table-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-table-modal-title"
      >
        {/* Modal Header */}
        <div className="data-table-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 id="data-table-modal-title" className="data-table-modal-title">
                  {title}
                </h2>
                {badge && <span className="data-table-modal-badge">{badge}</span>}
              </div>
              {subtitle && <p className="data-table-modal-subtitle">{subtitle}</p>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {headerAction}
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close dialog"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body with internal sticky scroll */}
        <div className="data-table-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export default DataTableModal;

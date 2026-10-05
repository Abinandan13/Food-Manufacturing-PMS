import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowDownRight } from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';

function LowStockTable({ materials = [] }) {
  if (!materials || materials.length === 0) {
    return (
      <div className="data-table-empty" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <CheckCircle size={36} color="var(--success)" style={{ margin: '0 auto 12px' }} />
        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>All Stock Healthy</h4>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          All raw materials are above their reorder level. No restocking needed right now.
        </p>
      </div>
    );
  }

  return (
    <div className="modal-table-wrap">
      <table className="modal-data-table">
        <thead>
          <tr>
            <th style={{ minWidth: 200, textAlign: 'left' }}>Material</th>
            <th style={{ minWidth: 130, textAlign: 'right' }}>Current Stock</th>
            <th style={{ minWidth: 130, textAlign: 'right' }}>Reorder Level</th>
            <th style={{ minWidth: 140, textAlign: 'left' }}>Supplier</th>
            <th style={{ minWidth: 110, textAlign: 'center' }}>Status</th>
            <th style={{ minWidth: 120, textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((mat) => {
            const isOut = mat.currentStock <= 0;
            return (
              <tr key={mat._id}>
                <td style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13.5 }}>
                    {mat.materialName}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                    {mat.materialId}
                  </div>
                </td>

                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ fontWeight: 700, color: isOut ? '#dc2626' : '#d97706' }}>
                    {mat.currentStock}
                  </span>{' '}
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{mat.unit}</span>
                </td>

                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {mat.reorderLevel}
                  </span>{' '}
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{mat.unit}</span>
                </td>

                <td style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: 12.5 }}>{mat.supplier || 'N/A'}</span>
                </td>

                <td style={{ textAlign: 'center' }}>
                  <StatusBadge status={mat.status} />
                </td>

                <td style={{ textAlign: 'right' }}>
                  <Link
                    to="/inventory"
                    className="btn btn-sm btn-primary"
                    style={{
                      padding: '5px 10px',
                      fontSize: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <ArrowDownRight size={13} /> Receive
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default LowStockTable;

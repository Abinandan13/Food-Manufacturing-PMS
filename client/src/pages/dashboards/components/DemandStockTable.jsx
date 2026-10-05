import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, CheckCircle, Plus } from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';

function DemandStockTable({ products = [] }) {
  if (!products || products.length === 0) {
    return (
      <div className="data-table-empty" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <CheckCircle size={36} color="var(--success)" style={{ margin: '0 auto 12px' }} />
        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Finished Stock Optimal</h4>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          All customer demand is covered by existing finished goods stock. No new production required at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="modal-table-wrap">
      <table className="modal-data-table">
        <thead>
          <tr>
            <th style={{ minWidth: 220, textAlign: 'left' }}>Product</th>
            <th style={{ minWidth: 120, textAlign: 'left' }}>Category</th>
            <th style={{ minWidth: 130, textAlign: 'right' }}>Active Demand</th>
            <th style={{ minWidth: 130, textAlign: 'right' }}>Finished Stock</th>
            <th style={{ minWidth: 160, textAlign: 'right' }}>Suggested Production</th>
            <th style={{ minWidth: 160, textAlign: 'center' }}>Status</th>
            <th style={{ minWidth: 120, textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((prod) => {
            const isOptimal = prod.suggestedProduction === 0;
            return (
              <tr key={prod.productId}>
                <td style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13.5 }}>
                    {prod.productName}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                    {prod.productCode}
                  </div>
                </td>

                <td style={{ textAlign: 'left' }}>
                  <span className="badge badge-gray">{prod.category || 'General'}</span>
                </td>

                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {prod.totalDemand?.toLocaleString()}
                  </span>{' '}
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{prod.unit}</span>
                </td>

                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {prod.availableFinishedStock?.toLocaleString()}
                  </span>{' '}
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{prod.unit}</span>
                </td>

                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 13.5,
                      color: isOptimal ? 'var(--success)' : 'var(--warning)',
                    }}
                  >
                    {prod.suggestedProduction?.toLocaleString()}
                  </span>{' '}
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{prod.unit}</span>
                </td>

                <td style={{ textAlign: 'center' }}>
                  <StatusBadge status={prod.status} />
                </td>

                <td style={{ textAlign: 'right' }}>
                  {isOptimal ? (
                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                      }}
                    >
                      Stock Optimal
                    </span>
                  ) : (
                    <Link
                      to="/production"
                      state={{
                        selectedProduct: prod.productId,
                        defaultQty: prod.suggestedProduction,
                      }}
                      className="btn btn-sm btn-primary"
                      style={{
                        padding: '5px 10px',
                        fontSize: 12,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Plus size={13} /> Plan Batch
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DemandStockTable;

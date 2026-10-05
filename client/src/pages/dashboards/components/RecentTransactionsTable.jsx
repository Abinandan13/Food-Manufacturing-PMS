import React from 'react';
import { Boxes } from 'lucide-react';

function RecentTransactionsTable({ transactions = [] }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="data-table-empty" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Boxes size={36} color="var(--gray-400)" style={{ margin: '0 auto 12px' }} />
        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>No Transactions</h4>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          No inventory movements have been recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="modal-table-wrap">
      <table className="modal-data-table">
        <thead>
          <tr>
            <th style={{ minWidth: 80, textAlign: 'center' }}>Type</th>
            <th style={{ minWidth: 200, textAlign: 'left' }}>Material</th>
            <th style={{ minWidth: 130, textAlign: 'right' }}>Quantity</th>
            <th style={{ minWidth: 140, textAlign: 'left' }}>Reference</th>
            <th style={{ minWidth: 120, textAlign: 'left' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => {
            const isIN = txn.transactionType === 'IN';
            const isOUT = txn.transactionType === 'OUT';
            return (
              <tr key={txn._id}>
                <td style={{ textAlign: 'center' }}>
                  <span
                    className="badge"
                    style={{
                      background: isIN ? '#dcfce7' : isOUT ? '#fee2e2' : '#fef3c7',
                      color: isIN ? '#166534' : isOUT ? '#991b1b' : '#92400e',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {txn.transactionType}
                  </span>
                </td>

                <td style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>
                    {txn.materialId?.materialName || 'Material'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                    {txn.materialId?.materialId || ''}
                  </div>
                </td>

                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ fontWeight: 700, color: isIN ? '#16a34a' : isOUT ? '#dc2626' : '#d97706' }}>
                    {isIN ? '+' : isOUT ? '-' : ''}{txn.quantity}
                  </span>{' '}
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {txn.materialId?.unit || 'units'}
                  </span>
                </td>

                <td style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {txn.reference || txn.inventoryId || '—'}
                  </span>
                </td>

                <td style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: 12.5 }}>
                  {new Date(txn.transactionDate || txn.createdAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default RecentTransactionsTable;

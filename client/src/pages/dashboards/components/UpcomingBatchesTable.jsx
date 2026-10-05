import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight } from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';

function UpcomingBatchesTable({ plans = [] }) {
  if (!plans || plans.length === 0) {
    return (
      <div className="data-table-empty" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <CalendarDays size={36} color="var(--gray-400)" style={{ margin: '0 auto 12px' }} />
        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>No Upcoming Batches</h4>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          There are currently no scheduled or in-progress production batches.
        </p>
      </div>
    );
  }

  return (
    <div className="modal-table-wrap">
      <table className="modal-data-table">
        <thead>
          <tr>
            <th style={{ minWidth: 120, textAlign: 'left' }}>Plan ID</th>
            <th style={{ minWidth: 200, textAlign: 'left' }}>Product</th>
            <th style={{ minWidth: 150, textAlign: 'left' }}>Demand / Order</th>
            <th style={{ minWidth: 130, textAlign: 'right' }}>Quantity</th>
            <th style={{ minWidth: 120, textAlign: 'left' }}>Start Date</th>
            <th style={{ minWidth: 120, textAlign: 'left' }}>End Date</th>
            <th style={{ minWidth: 110, textAlign: 'center' }}>Priority</th>
            <th style={{ minWidth: 120, textAlign: 'center' }}>Status</th>
            <th style={{ minWidth: 100, textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan._id}>
              <td style={{ textAlign: 'left' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace', fontSize: 12.5 }}>
                  {plan.planId}
                </span>
              </td>

              <td style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {plan.productId?.productName || '—'}
                </div>
                {plan.productId?.productId && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {plan.productId.productId}
                  </div>
                )}
              </td>

              <td style={{ textAlign: 'left' }}>
                {plan.demandId ? (
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {plan.demandId.customerName || 'Direct Order'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {plan.demandId.demandId || ''}
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Stock Production</span>
                )}
              </td>

              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {plan.plannedQuantity?.toLocaleString()}
                </span>{' '}
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  {plan.productId?.unit || 'units'}
                </span>
              </td>

              <td style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: 12.5 }}>
                {plan.startDate ? new Date(plan.startDate).toLocaleDateString() : '—'}
              </td>

              <td style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: 12.5 }}>
                {plan.endDate ? new Date(plan.endDate).toLocaleDateString() : '—'}
              </td>

              <td style={{ textAlign: 'center' }}>
                <StatusBadge status={plan.priority} />
              </td>

              <td style={{ textAlign: 'center' }}>
                <StatusBadge status={plan.status} />
              </td>

              <td style={{ textAlign: 'right' }}>
                <Link
                  to="/production"
                  className="btn btn-sm btn-secondary"
                  style={{ padding: '4px 8px', fontSize: 11.5 }}
                >
                  Manage <ArrowRight size={11} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UpcomingBatchesTable;

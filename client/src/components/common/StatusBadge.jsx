import React from 'react';

/**
 * Semantic color badge for status, priority, and severity values.
 * Usage: <StatusBadge status="Completed" />
 */

const BADGE_MAP = {
  // Production / general
  Planned:         'badge-gray',
  Scheduled:       'badge-blue',
  'In Progress':   'badge-yellow',
  'In Production': 'badge-yellow',
  Completed:       'badge-green',
  Delayed:         'badge-red',
  Cancelled:       'badge-gray',

  // Account status
  Active:          'badge-green',
  Inactive:        'badge-gray',

  // Stock status
  Available:       'badge-green',
  'Low Stock':     'badge-yellow',
  'Out of Stock':  'badge-red',

  // Priority
  Low:             'badge-gray',
  Medium:          'badge-blue',
  High:            'badge-red',
  Urgent:          'badge-red',

  // Demand / order
  Pending:         'badge-yellow',
  Approved:        'badge-indigo',
  Fulfilled:       'badge-green',
  Rejected:        'badge-red',

  // Alert severity
  Critical:        'badge-red',
  Warning:         'badge-yellow',
  Info:            'badge-blue',
};

const DOTS = {
  'badge-green':  '#16A34A',
  'badge-yellow': '#D97706',
  'badge-red':    '#DC2626',
  'badge-blue':   '#15803D',
  'badge-indigo': '#166534',
  'badge-purple': '#EAB308',
  'badge-gray':   '#6B7280',
};

function StatusBadge({ status, value }) {
  status = status || value;
  if (!status) return null;
  const cls = BADGE_MAP[status] || 'badge-gray';
  const dotColor = DOTS[cls] || '#6b7280';
  return (
    <span className={`badge ${cls}`}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: dotColor,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      {status}
    </span>
  );
}

export default StatusBadge;

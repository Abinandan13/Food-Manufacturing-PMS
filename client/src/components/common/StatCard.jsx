import React from 'react';

/**
 * Premium stat card for the dashboard and overview sections.
 * color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'
 */
function StatCard({ label, value, icon, trend, color = 'blue' }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-content">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {trend && <div className="stat-card-trend">{trend}</div>}
      </div>
    </div>
  );
}

export default StatCard;

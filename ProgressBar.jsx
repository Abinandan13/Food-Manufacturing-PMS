import React from 'react';

/**
 * Labeled progress bar.
 * Usage: <ProgressBar value={75} max={100} color="green" showLabel />
 */
function ProgressBar({ value = 0, max = 100, color = 'blue', showLabel = false, size = 'md' }) {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colorClass =
    pct >= 80 ? 'progress-bar-green' :
    pct >= 40 ? '' :
    'progress-bar-red';

  const sizeClass = size === 'sm' ? 'progress-bar-sm' : size === 'lg' ? 'progress-bar-lg' : '';

  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{value}/{max}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{pct}%</span>
        </div>
      )}
      <div className={`progress-wrap`} style={{ height: size === 'sm' ? 5 : size === 'lg' ? 12 : 8 }}>
        <div
          className={`progress-bar ${colorClass} ${sizeClass}`}
          style={{ width: `${pct}%`, height: '100%' }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;

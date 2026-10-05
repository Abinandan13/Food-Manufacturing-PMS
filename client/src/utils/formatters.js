export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return Number(num).toLocaleString('en-IN');
};

export const formatCurrency = (num) => {
  if (num === undefined || num === null) return '₹0';
  return `₹${Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export const getDueDateStatus = (dueDateStr) => {
  if (!dueDateStr) return 'normal';
  const diff = new Date(dueDateStr) - new Date();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < 0) return 'overdue';
  if (days < 3) return 'urgent';
  if (days < 7) return 'warning';
  return 'normal';
};

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner spinner-primary" style={{ width: 36, height: 36, borderWidth: 3 }} />
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Verifying session...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based permission
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const roleFallback =
      user.role === 'Admin'
        ? '/dashboard/admin'
        : user.role === 'Inventory Manager'
        ? '/dashboard/inventory'
        : '/dashboard/production';

    return <Navigate to={roleFallback} replace />;
  }

  return children;
}

export default ProtectedRoute;

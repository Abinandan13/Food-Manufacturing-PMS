import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Eye,
  EyeOff,
  AlertCircle,
  ChefHat,
  LogIn,
  Shield,
  Activity,
  Boxes,
} from 'lucide-react';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Feedback states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick fill test account
  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(username.trim(), password);
      if (!res.success) {
        setError(res.message || 'Login failed. Please check your credentials.');
        return;
      }
      const role = res.user?.role;
      if (role === 'Admin') {
        navigate('/dashboard/admin');
      } else if (role === 'Production Manager') {
        navigate('/dashboard/production');
      } else if (role === 'Inventory Manager') {
        navigate('/dashboard/inventory');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-dots" />

      <div className="login-card" style={{ maxWidth: '460px' }}>
        {/* Logo & Header */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <ChefHat size={32} color="white" />
          </div>
          <h1>FoodManu PMS</h1>
          <p>Food Manufacturing Production Management System</p>
        </div>

        {/* Quick Role Fill Toolbar */}
        <div style={{ marginBottom: 18, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.04em' }}>
            Quick Demo Login:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin123')}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '6px 4px', background: username === 'admin' ? '#dcfce7' : '#ffffff',
                border: username === 'admin' ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#166534',
              }}
            >
              <Shield size={13} />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('prod_manager', 'manager123')}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '6px 4px', background: username === 'prod_manager' ? '#dcfce7' : '#ffffff',
                border: username === 'prod_manager' ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#166534',
              }}
            >
              <Activity size={13} />
              <span>Production</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('inv_manager', 'manager123')}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '6px 4px', background: username === 'inv_manager' ? '#dcfce7' : '#ffffff',
                border: username === 'inv_manager' ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#166534',
              }}
            >
              <Boxes size={13} />
              <span>Inventory</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="login-error">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg w-full"
            style={{ marginTop: '12px', justifyContent: 'center' }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={16} />
                Sign In
              </>
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
            Contact the administrator if you need an account.
          </div>

          {/* Admin Contact Info */}
          <div
            style={{
              marginTop: 14,
              padding: '12px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 8,
                letterSpacing: '0.02em',
              }}
            >
              Admin Contact
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span>📧</span>
                <a
                  href="mailto:admin@yourcompany.com"
                  style={{
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    fontWeight: 500,
                    wordBreak: 'break-all',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  admin@yourcompany.com
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span>📞</span>
                <a
                  href="tel:+9198655XXXXX"
                  style={{
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  +91 98655 XXXXX
                </a>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;

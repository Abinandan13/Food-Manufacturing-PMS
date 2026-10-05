import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Shield,
  Activity,
  Boxes,
  Lock,
  Power,
} from 'lucide-react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';

const ROLE_OPTIONS = ['Production Manager', 'Inventory Manager'];
const ALL_ROLES = ['Admin', 'Production Manager', 'Inventory Manager'];
const STATUS_OPTIONS = ['Active', 'Inactive'];

const emptyAddForm = {
  name: '',
  username: '',
  email: '',
  password: '',
  role: 'Production Manager',
};

const emptyEditForm = {
  name: '',
  email: '',
  role: 'Production Manager',
  status: 'Active',
  password: '',
};

function UserManagement() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add User Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [addFormError, setAddFormError] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit User Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editFormError, setEditFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete Dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Quick Status Toggle Action
  const [togglingId, setTogglingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Dismiss success alert after 4 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Open Add Modal
  const openAddModal = () => {
    setAddForm(emptyAddForm);
    setAddFormError('');
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setAddForm(emptyAddForm);
    setAddFormError('');
  };

  // Open Edit Modal
  const openEditModal = (u) => {
    setEditingUser(u);
    setEditForm({
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'Production Manager',
      status: u.status || 'Active',
      password: '',
    });
    setEditFormError('');
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingUser(null);
    setEditForm(emptyEditForm);
    setEditFormError('');
  };

  // Handle Add User Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddFormError('');

    if (!addForm.username.trim() || addForm.username.trim().length < 3) {
      setAddFormError('Username must be at least 3 characters.');
      return;
    }
    if (!addForm.email.trim() || !/^\S+@\S+\.\S+$/.test(addForm.email.trim())) {
      setAddFormError('Please enter a valid email address.');
      return;
    }
    if (!addForm.password || addForm.password.length < 6) {
      setAddFormError('Password must be at least 6 characters.');
      return;
    }

    setAdding(true);
    try {
      await usersAPI.create({
        name: addForm.name.trim(),
        username: addForm.username.trim(),
        email: addForm.email.trim().toLowerCase(),
        password: addForm.password,
        role: addForm.role,
      });

      setSuccess(`User "${addForm.username}" created successfully.`);
      closeAddModal();
      fetchUsers();
    } catch (err) {
      setAddFormError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setAdding(false);
    }
  };

  // Handle Edit User Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditFormError('');

    if (!editForm.email.trim() || !/^\S+@\S+\.\S+$/.test(editForm.email.trim())) {
      setEditFormError('Please enter a valid email address.');
      return;
    }

    if (editForm.password && editForm.password.length < 6) {
      setEditFormError('New password must be at least 6 characters if provided.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim().toLowerCase(),
        status: editForm.status,
      };

      // Only pass role if not an Admin user
      if (editingUser.role !== 'Admin') {
        payload.role = editForm.role;
      }

      if (editForm.password && editForm.password.trim().length >= 6) {
        payload.password = editForm.password.trim();
      }

      await usersAPI.update(editingUser._id, payload);
      setSuccess(`User "${editingUser.username}" updated successfully.`);
      closeEditModal();
      fetchUsers();
    } catch (err) {
      setEditFormError(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  // Quick Status Toggle
  const handleToggleStatus = async (targetUser) => {
    if (targetUser.role === 'Admin') {
      setError('Cannot change status of Admin accounts here.');
      return;
    }
    const newStatus = targetUser.status === 'Active' ? 'Inactive' : 'Active';
    setTogglingId(targetUser._id);
    try {
      await usersAPI.update(targetUser._id, { status: newStatus });
      setSuccess(`User "${targetUser.username}" set to ${newStatus}.`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to set user to ${newStatus}.`);
    } finally {
      setTogglingId(null);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersAPI.delete(deleteTarget._id);
      setSuccess(`User "${deleteTarget.username}" deleted successfully.`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q);

    const matchRole = !roleFilter || u.role === roleFilter;
    const matchStatus = !statusFilter || u.status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  // Role visual helper
  const renderRoleBadge = (role) => {
    if (role === 'Admin') {
      return (
        <span
          className="badge"
          style={{
            background: '#e0e7ff',
            color: '#3730a3',
            border: '1px solid #c7d2fe',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Shield size={12} />
          Admin
        </span>
      );
    }
    if (role === 'Production Manager') {
      return (
        <span
          className="badge"
          style={{
            background: '#dcfce7',
            color: '#166534',
            border: '1px solid #bbf7d0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Activity size={12} />
          Production Manager
        </span>
      );
    }
    if (role === 'Inventory Manager') {
      return (
        <span
          className="badge"
          style={{
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Boxes size={12} />
          Inventory Manager
        </span>
      );
    }
    return <span className="badge badge-gray">{role}</span>;
  };

  // User Initials
  const getInitials = (u) => {
    return (u.name || u.username || 'U')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-header-title">User Management</h1>
          <p className="page-header-desc">
            Manage system user accounts, assigned roles, and login access status (Admin Only)
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={fetchUsers} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <UserPlus size={14} /> Add User
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          className="alert alert-success"
          style={{
            marginBottom: 16,
            background: '#dcfce7',
            color: '#166534',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 'var(--radius)',
          }}
        >
          <CheckCircle size={15} color="#16a34a" />
          <span>{success}</span>
        </div>
      )}

      {/* Stats Summary Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Users
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
            {users.length}
          </div>
        </div>
        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', textTransform: 'uppercase' }}>
            Active Accounts
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#166534', marginTop: 4 }}>
            {users.filter((u) => u.status === 'Active').length}
          </div>
        </div>
        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', textTransform: 'uppercase' }}>
            Inactive Accounts
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#991b1b', marginTop: 4 }}>
            {users.filter((u) => u.status === 'Inactive').length}
          </div>
        </div>
        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#4338ca', textTransform: 'uppercase' }}>
            Managers (Prod / Inv)
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#3730a3', marginTop: 4 }}>
            {users.filter((u) => u.role !== 'Admin').length}
          </div>
        </div>
      </div>

      {/* Filter / Search Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar" style={{ width: 280 }}>
            <Search size={15} className="search-bar-icon" />
            <input
              type="text"
              placeholder="Search by name, username, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-right">
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <div className="spinner spinner-primary" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    Loading users...
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="data-table-empty">
                  <Users size={32} style={{ margin: '0 auto 10px', color: 'var(--gray-300)' }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No users found</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>
                    {search || roleFilter || statusFilter
                      ? 'Try adjusting your search or filters.'
                      : 'Click "Add User" to create a new user account.'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isSelf = currentUser?._id === u._id || currentUser?.id === u._id;
                const isAdmin = u.role === 'Admin';

                return (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: isAdmin ? '#e0e7ff' : '#f1f5f9',
                            color: isAdmin ? '#4338ca' : 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(u)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {u.name || u.username}
                            {isSelf && (
                              <span
                                style={{
                                  marginLeft: 6,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  background: '#dcfce7',
                                  color: '#166534',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                }}
                              >
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        @{u.username}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>{renderRoleBadge(u.role)}</td>
                    <td>
                      <StatusBadge status={u.status} />
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* Quick Toggle Status */}
                        {!isAdmin && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            title={u.status === 'Active' ? 'Deactivate user' : 'Activate user'}
                            onClick={() => handleToggleStatus(u)}
                            disabled={togglingId === u._id}
                            style={{
                              padding: '5px 8px',
                              color: u.status === 'Active' ? 'var(--danger)' : '#16a34a',
                              borderColor: u.status === 'Active' ? 'var(--danger-light)' : '#bbf7d0',
                            }}
                          >
                            <Power size={13} />
                            <span style={{ fontSize: 11 }}>
                              {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </span>
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(u)}
                          style={{ padding: '5px 10px' }}
                        >
                          <Edit2 size={13} /> Edit
                        </button>

                        {/* Delete Button (disabled for Admin accounts and current user) */}
                        {!isAdmin && !isSelf && (
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => setDeleteTarget(u)}
                            style={{
                              padding: '5px 10px',
                              background: 'var(--danger-50)',
                              color: 'var(--danger)',
                              border: '1px solid var(--danger-light)',
                            }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={closeAddModal}
        title="Add New User"
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeAddModal} disabled={adding}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAddSubmit} disabled={adding}>
              {adding ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </button>
          </>
        }
      >
        {addFormError && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <AlertCircle size={14} />
            <span>{addFormError}</span>
          </div>
        )}
        <form onSubmit={handleAddSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-control"
              type="text"
              name="name"
              value={addForm.name}
              onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. John Doe"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label form-label-required">Username</label>
              <input
                className="form-control"
                type="text"
                name="username"
                value={addForm.username}
                onChange={(e) => setAddForm((prev) => ({ ...prev, username: e.target.value }))}
                required
                placeholder="e.g. jdoe"
              />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">Email</label>
              <input
                className="form-control"
                type="email"
                name="email"
                value={addForm.email}
                onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))}
                required
                placeholder="e.g. jdoe@foodmfg.com"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label form-label-required">Password</label>
              <input
                className="form-control"
                type="password"
                name="password"
                value={addForm.password}
                onChange={(e) => setAddForm((prev) => ({ ...prev, password: e.target.value }))}
                required
                placeholder="Min 6 characters"
              />
            </div>
            <div className="form-group">
              <label className="form-label form-label-required">Assigned Role</label>
              <select
                className="form-control"
                name="role"
                value={addForm.role}
                onChange={(e) => setAddForm((prev) => ({ ...prev, role: e.target.value }))}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius)',
              fontSize: 12,
              color: 'var(--text-secondary)',
              marginTop: 4,
            }}
          >
            <strong>Note:</strong> Newly created user accounts are <strong>Active</strong> by default.
            Only <em>Production Manager</em> and <em>Inventory Manager</em> roles can be created.
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={closeEditModal}
        title={`Edit User: ${editingUser?.username || ''}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeEditModal} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleEditSubmit} disabled={saving}>
              {saving ? (
                <>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </>
        }
      >
        {editFormError && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <AlertCircle size={14} />
            <span>{editFormError}</span>
          </div>
        )}
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-control"
              type="text"
              name="name"
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. John Doe"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label form-label-required">Email</label>
              <input
                className="form-control"
                type="email"
                name="email"
                value={editForm.email}
                onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Status</label>
              <select
                className="form-control"
                name="status"
                value={editForm.status}
                onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            {editingUser?.role === 'Admin' ? (
              <div
                style={{
                  padding: '9px 12px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--radius)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Lock size={14} /> Admin (Primary role cannot be changed)
              </div>
            ) : (
              <select
                className="form-control"
                name="role"
                value={editForm.role}
                onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Reset Password (Optional)</label>
            <input
              className="form-control"
              type="password"
              name="password"
              value={editForm.password}
              onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Leave blank to keep existing password"
            />
            <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
              Minimum 6 characters. Leave empty if you don't wish to change the password.
            </small>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete User Account?"
        message={`Are you sure you want to permanently delete user account "${deleteTarget?.username}" (${deleteTarget?.email})? This action cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default UserManagement;

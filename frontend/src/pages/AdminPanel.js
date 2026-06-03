import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers({ page, limit: 10, search: search || undefined })
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
      setMeta(usersRes.data.meta);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change role to ${newRole}?`)) return;
    try {
      await adminAPI.updateRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    if (!window.confirm(`${currentStatus ? 'Deactivate' : 'Activate'} this user?`)) return;
    try {
      await adminAPI.toggleStatus(userId);
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">Manage users and monitor platform health</p>
      </div>

      {stats && (
        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <div className="stat-card">
            <div className="stat-card-label">Total Users</div>
            <div className="stat-card-value">{stats.users.total}</div>
            <div className="stat-card-sub">{stats.users.active} active</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Admins</div>
            <div className="stat-card-value" style={{ color: 'var(--accent)' }}>{stats.users.admins}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Total Tasks</div>
            <div className="stat-card-value">{stats.tasks.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Completed Tasks</div>
            <div className="stat-card-value" style={{ color: 'var(--success)' }}>{stats.tasks.completed}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Inactive Users</div>
            <div className="stat-card-value" style={{ color: 'var(--danger)' }}>{stats.users.inactive}</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">User Management</span>
          <input type="text" className="form-input" style={{ width: 220, padding: '7px 12px', fontSize: 13 }}
            placeholder="Search users..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user.name}</td>
                    <td>{user.email}</td>
                    <td><span className={`badge badge-${user.role}`}>{user.role}</span></td>
                    <td>
                      <span className={`badge ${user.isActive ? 'badge-completed' : 'badge-high'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm"
                          onClick={() => handleRoleChange(user._id, user.role)}>
                          {user.role === 'admin' ? '→ User' : '→ Admin'}
                        </button>
                        <button className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleStatusToggle(user._id, user.isActive)}>
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {meta.totalPages > 1 && (
              <div className="pagination" style={{ padding: '16px 0' }}>
                <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span className="pagination-info">Page {page} of {meta.totalPages}</span>
                <button className="btn btn-secondary btn-sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

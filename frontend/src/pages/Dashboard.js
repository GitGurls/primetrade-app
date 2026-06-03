import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, sub, color }) => (
  <div className="stat-card">
    <div className="stat-card-label">{label}</div>
    <div className="stat-card-value" style={{ color }}>{value}</div>
    {sub && <div className="stat-card-sub">{sub}</div>}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          taskAPI.getStats(),
          taskAPI.getAll({ limit: 5, sortBy: 'createdAt', order: 'desc' })
        ]);
        setStats(statsRes.data.data);
        setRecentTasks(tasksRes.data.data);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div className="spinner"></div>
    </div>
  );

  const completionRate = stats?.total > 0
    ? Math.round((stats.byStatus.completed / stats.total) * 100)
    : 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Here's what's happening with your tasks today.</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <StatCard label="Total Tasks" value={stats.total} sub="All time" />
          <StatCard label="Pending" value={stats.byStatus.pending} sub="Need attention" color="var(--warning)" />
          <StatCard label="In Progress" value={stats.byStatus['in-progress']} sub="Currently active" color="var(--info)" />
          <StatCard label="Completed" value={stats.byStatus.completed} sub={`${completionRate}% completion rate`} color="var(--success)" />
          <StatCard label="High Priority" value={stats.byPriority.high} sub="Urgent tasks" color="var(--danger)" />
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Tasks</span>
          <Link to="/tasks" className="btn btn-secondary btn-sm">View All →</Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No tasks yet</h3>
            <p>Create your first task to get started</p>
            <Link to="/tasks" className="btn btn-primary">Create Task</Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map(task => (
                  <tr key={task._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{task.title}</td>
                    <td>
                      <span className={`badge badge-${task.status}`}>
                        {task.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    </td>
                    <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { taskAPI } from '../services/api';
import toast from 'react-hot-toast';

const TaskModal = ({ task, onClose, onSave }) => {
  const isEdit = Boolean(task?._id);
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'pending',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    tags: task?.tags?.join(', ') || ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    else if (form.title.trim().length < 3) e.title = 'Title must be at least 3 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        dueDate: form.dueDate || undefined
      };
      if (isEdit) {
        await taskAPI.update(task._id, payload);
        toast.success('Task updated!');
      } else {
        await taskAPI.create(payload);
        toast.success('Task created!');
      }
      onSave();
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong';
      toast.error(msg);
      if (err.response?.data?.errors) {
        const fe = {};
        err.response.data.errors.forEach(e => { fe[e.field] = e.message; });
        setErrors(fe);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Task' : 'Create New Task'}</h2>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input type="text" className="form-input" placeholder="What needs to be done?"
              value={form.title} onChange={e => { setForm(p => ({...p, title: e.target.value})); if(errors.title) setErrors(p => ({...p, title:''})); }} />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} placeholder="Add more details..."
              value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
              style={{ resize: 'vertical' }} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input filter-select" style={{ width: '100%' }}
                value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))}>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input filter-select" style={{ width: '100%' }}
                value={form.priority} onChange={e => setForm(p => ({...p, priority: e.target.value}))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input"
                value={form.dueDate} onChange={e => setForm(p => ({...p, dueDate: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input type="text" className="form-input" placeholder="api, backend, urgent"
                value={form.tags} onChange={e => setForm(p => ({...p, tags: e.target.value}))} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (isEdit ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TaskCard = ({ task, onEdit, onDelete }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <div className="task-card">
      <div className="task-card-header">
        <h3 className="task-card-title">{task.title}</h3>
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
      </div>
      {task.description && <p className="task-card-desc">{task.description}</p>}
      {task.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {task.tags.map(tag => (
            <span key={tag} style={{ padding: '2px 8px', background: 'var(--bg-overlay)', borderRadius: 99, fontSize: 11, color: 'var(--text-muted)' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div className="task-card-footer">
        <div className="task-card-meta">
          <span className={`badge badge-${task.status}`}>{task.status.replace('-', ' ')}</span>
          {task.dueDate && (
            <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>
              {isOverdue ? '⚠️ ' : '📅 '}{new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="task-card-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => onEdit(task)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(task._id)}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, task: null });
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', page: 1 });
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 9 };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;

      const res = await taskAPI.getAll(params);
      setTasks(res.data.data);
      setMeta(res.data.meta);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskAPI.delete(id);
      toast.success('Task deleted');
      fetchTasks();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleSave = () => {
    setModal({ open: false, task: null });
    fetchTasks();
  };

  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">{meta.total} total tasks</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ open: true, task: null })}>
          + New Task
        </button>
      </div>

      <div className="filters">
        <input type="text" className="form-input search-input" placeholder="🔍 Search tasks..."
          value={filters.search} onChange={e => handleFilter('search', e.target.value)} />
        <select className="filter-select" value={filters.status} onChange={e => handleFilter('status', e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select className="filter-select" value={filters.priority} onChange={e => handleFilter('priority', e.target.value)}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        {(filters.status || filters.priority || filters.search) && (
          <button className="btn btn-secondary btn-sm"
            onClick={() => setFilters({ status: '', priority: '', search: '', page: 1 })}>
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No tasks found</h3>
          <p>{filters.status || filters.priority || filters.search ? 'Try adjusting your filters' : 'Create your first task to get started'}</p>
          <button className="btn btn-primary" onClick={() => setModal({ open: true, task: null })}>
            Create Task
          </button>
        </div>
      ) : (
        <>
          <div className="tasks-grid">
            {tasks.map(task => (
              <TaskCard key={task._id} task={task}
                onEdit={(t) => setModal({ open: true, task: t })}
                onDelete={handleDelete} />
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-secondary btn-sm"
                disabled={filters.page <= 1}
                onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>
                ← Prev
              </button>
              <span className="pagination-info">
                Page {filters.page} of {meta.totalPages}
              </span>
              <button className="btn btn-secondary btn-sm"
                disabled={filters.page >= meta.totalPages}
                onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {modal.open && (
        <TaskModal
          task={modal.task}
          onClose={() => setModal({ open: false, task: null })}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

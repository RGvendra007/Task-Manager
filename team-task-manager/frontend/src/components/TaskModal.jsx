import React, { useState } from 'react';
import { taskApi } from '../api/services';
import { STATUS_LABELS, PRIORITY_LABELS, STATUS_KEYS, PRIORITY_KEYS, formatDate, isOverdue } from '../utils/helpers';

export function TaskModal({ task, projectId, members, onClose, onSave, onDelete }) {
  const isNew = !task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'TODO',
    priority: task?.priority || 'MEDIUM',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    assigneeId: task?.assigneeId || '',
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form, assigneeId: form.assigneeId || null, dueDate: form.dueDate || null };
      let res;
      if (isNew) {
        res = await taskApi.create(projectId, payload);
      } else {
        res = await taskApi.update(task.id, payload);
      }
      onSave(res.data.task);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    setDeleting(true);
    try {
      await taskApi.delete(task.id);
      onDelete(task.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete');
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">{isNew ? 'New Task' : 'Edit Task'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="Task title" value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Optional description…" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_KEYS.map(k => <option key={k} value={k}>{STATUS_LABELS[k]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITY_KEYS.map(k => <option key={k} value={k}>{PRIORITY_LABELS[k]}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="form-select" value={form.assigneeId} onChange={e => set('assigneeId', e.target.value)}>
                <option value="">Unassigned</option>
                {(members || []).map(m => (
                  <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <div>
              {!isNew && (
                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? <><div className="spinner" />{isNew ? 'Creating…' : 'Saving…'}</> : isNew ? 'Create Task' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

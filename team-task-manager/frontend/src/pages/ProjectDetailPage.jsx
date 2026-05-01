import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectApi, taskApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { TaskModal } from '../components/TaskModal';
import { STATUS_LABELS, STATUS_KEYS, PRIORITY_LABELS, formatDate, isOverdue, getInitials } from '../utils/helpers';

const STATUS_COLORS = { TODO: '#6b7280', IN_PROGRESS: '#3b82f6', IN_REVIEW: '#f59e0b', DONE: '#22c55e' };

function MemberModal({ project, onClose, onUpdate }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addMember = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await projectApi.addMember(project.id, { email, role });
      const updated = await projectApi.get(project.id);
      onUpdate(updated.data.project);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await projectApi.removeMember(project.id, memberId);
      const updated = await projectApi.get(project.id);
      onUpdate(updated.data.project);
    } catch (err) {
      alert(err.message || 'Failed to remove member');
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Manage Members</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={addMember} style={{ marginBottom: 20 }}>
          <div className="form-group">
            <label className="form-label">Add Member by Email</label>
            <input className="form-input" type="email" placeholder="user@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }}>{error}</div>}
          <button className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? 'Adding…' : '+ Add Member'}
          </button>
        </form>

        <div className="divider" />
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>
          Current Members ({project.members?.length})
        </h3>
        <div className="members-list">
          {project.members?.map(m => (
            <div key={m.userId} className="member-item">
              <div className="avatar">{getInitials(m.user?.name)}</div>
              <div className="member-info">
                <div className="member-name">{m.user?.name}</div>
                <div className="member-email">{m.user?.email}</div>
              </div>
              <span className={`badge badge-${m.role?.toLowerCase()}`}>{m.role}</span>
              {m.userId !== project.ownerId && (
                <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeMember(m.userId)}>✕</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KanbanCard({ task, onClick }) {
  const overdue = isOverdue(task.dueDate) && task.status !== 'DONE';
  return (
    <div className="task-card" onClick={() => onClick(task)}>
      <div className="task-card-header">
        <span className="task-title">{task.title}</span>
        <span className={`badge badge-${task.priority?.toLowerCase()}`}>{task.priority}</span>
      </div>
      {task.description && (
        <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4 }}>{task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}</p>
      )}
      <div className="task-meta">
        {task.assignee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div className="avatar" style={{ width: 20, height: 20, fontSize: 9 }}>{getInitials(task.assignee?.name)}</div>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{task.assignee?.name?.split(' ')[0]}</span>
          </div>
        )}
        {task.dueDate && (
          <span className={`task-due ${overdue ? 'overdue' : ''}`}>
            {overdue ? '⚠ ' : ''}Due {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        projectApi.get(id),
        taskApi.projectTasks(id),
      ]);
      setProject(pRes.data.project);
      setTasks(tRes.data.tasks);
    } catch {
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const isAdmin = project?.myRole === 'ADMIN';

  const handleTaskSave = (saved) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === saved.id);
      if (idx === -1) return [saved, ...prev];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
  };

  const handleTaskDelete = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  if (loading) return (
    <div className="page-loader" style={{ minHeight: 300 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  if (!project) return null;

  const tasksByStatus = STATUS_KEYS.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: project.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>◈</div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>{project.name}</h1>
            {project.description && <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 2 }}>{project.description}</p>}
          </div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowMembers(true)}>
            👥 {project.members?.length} members
          </button>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => { setSelectedTask(null); setShowTaskModal(true); }}>
              ＋ Add Task
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ maxWidth: 320 }}>
        <button className={`tab ${tab === 'board' ? 'active' : ''}`} onClick={() => setTab('board')}>⊞ Board</button>
        <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>☰ List</button>
      </div>

      {/* Board View */}
      {tab === 'board' && (
        <div className="kanban-board">
          {STATUS_KEYS.map(status => (
            <div key={status} className="kanban-col">
              <div className="kanban-col-header">
                <span className="kanban-col-title" style={{ color: STATUS_COLORS[status] }}>
                  {STATUS_LABELS[status]}
                </span>
                <span className="kanban-count">{tasksByStatus[status]?.length || 0}</span>
              </div>
              <div className="kanban-cards">
                {tasksByStatus[status]?.map(task => (
                  <KanbanCard key={task.id} task={task} onClick={(t) => { setSelectedTask(t); setShowTaskModal(true); }} />
                ))}
                {tasksByStatus[status]?.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: 12 }}>No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {tab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✦</div>
              <h3>No tasks yet</h3>
              {isAdmin && <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => { setSelectedTask(null); setShowTaskModal(true); }}>Add First Task</button>}
            </div>
          ) : tasks.map(t => {
            const overdue = isOverdue(t.dueDate) && t.status !== 'DONE';
            return (
              <div key={t.id} className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                onClick={() => { setSelectedTask(t); setShowTaskModal(true); }}>
                <span className={`badge badge-${t.status.toLowerCase()}`}>{STATUS_LABELS[t.status]}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{t.title}</span>
                <span className={`badge badge-${t.priority.toLowerCase()}`}>{PRIORITY_LABELS[t.priority]}</span>
                {t.assignee && (
                  <div className="flex items-center gap-2">
                    <div className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{getInitials(t.assignee?.name)}</div>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.assignee?.name?.split(' ')[0]}</span>
                  </div>
                )}
                {t.dueDate && <span className={`task-due ${overdue ? 'overdue' : ''}`}>{overdue ? '⚠ ' : ''}{formatDate(t.dueDate)}</span>}
              </div>
            );
          })}
        </div>
      )}

      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          projectId={id}
          members={project.members}
          onClose={() => setShowTaskModal(false)}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
        />
      )}

      {showMembers && (
        <MemberModal
          project={project}
          onClose={() => setShowMembers(false)}
          onUpdate={setProject}
        />
      )}
    </>
  );
}

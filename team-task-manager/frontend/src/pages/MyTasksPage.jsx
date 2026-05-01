import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskApi } from '../api/services';
import { STATUS_LABELS, PRIORITY_LABELS, formatDate, isOverdue } from '../utils/helpers';

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    taskApi.myTasks()
      .then(res => setTasks(res.data.tasks))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tasks.filter(t => {
    if (filter === 'active') return t.status !== 'DONE';
    if (filter === 'done') return t.status === 'DONE';
    if (filter === 'overdue') return isOverdue(t.dueDate) && t.status !== 'DONE';
    return true;
  });

  if (loading) return (
    <div className="page-loader" style={{ minHeight: 300 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>My Tasks</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14, marginTop: 4 }}>{tasks.length} tasks assigned to you</p>
        </div>
      </div>

      <div className="tabs" style={{ maxWidth: 380, marginBottom: 20 }}>
        {[['all','All'],['active','Active'],['done','Done'],['overdue','Overdue']].map(([v,l]) => (
          <button key={v} className={`tab ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✦</div>
          <h3>No tasks found</h3>
          <p>Tasks assigned to you will appear here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(t => {
            const overdue = isOverdue(t.dueDate) && t.status !== 'DONE';
            return (
              <Link key={t.id} to={`/projects/${t.project?.id}`} style={{ textDecoration: 'none' }}>
                <div className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.project?.color || 'var(--accent)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{t.project?.name}</div>
                  </div>
                  <span className={`badge badge-${t.status.toLowerCase()}`}>{STATUS_LABELS[t.status]}</span>
                  <span className={`badge badge-${t.priority.toLowerCase()}`}>{PRIORITY_LABELS[t.priority]}</span>
                  {t.dueDate && (
                    <span className={`task-due ${overdue ? 'overdue' : ''}`}>
                      {overdue ? '⚠ ' : ''}{formatDate(t.dueDate)}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

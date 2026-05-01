import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatDate, isOverdue } from '../utils/helpers';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get()
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-loader" style={{ minHeight: 300 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  const { taskStats = {}, overdueTasks = 0, projects = [], recentTasks = [] } = data || {};

  const statCards = [
    { label: 'To Do', value: taskStats.TODO || 0, color: '#6b7280' },
    { label: 'In Progress', value: taskStats.IN_PROGRESS || 0, color: '#3b82f6' },
    { label: 'In Review', value: taskStats.IN_REVIEW || 0, color: '#f59e0b' },
    { label: 'Done', value: taskStats.DONE || 0, color: '#22c55e' },
    { label: 'Overdue', value: overdueTasks, color: '#ef4444' },
  ];

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-3)', marginTop: 4, fontSize: 14 }}>Here's what's happening across your projects.</p>
      </div>

      <div className="stats-grid">
        {statCards.map(s => (
          <div key={s.label} className="stat-card" style={{ '--accent-color': s.color }}>
            <div className="stat-number" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>Recent Projects</h2>
            <Link to="/projects" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {projects.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '24px' }}>
                <div className="empty-state-icon">◈</div>
                <p>No projects yet</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {projects.map(p => (
                <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: p.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>◈</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                        {p._count?.tasks || 0} tasks · {p.members?.length || 0} members
                      </div>
                    </div>
                    <span className={`badge badge-${p.myRole?.toLowerCase()}`}>{p.myRole}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent Tasks</h2>
          {recentTasks.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '24px' }}>
                <div className="empty-state-icon">✦</div>
                <p>No tasks yet</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentTasks.slice(0, 6).map(t => (
                <div key={t.id} className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.project?.color || 'var(--accent)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.project?.name}</div>
                  </div>
                  <span className={`badge badge-${t.status.toLowerCase().replace('_', '_')}`}>{t.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

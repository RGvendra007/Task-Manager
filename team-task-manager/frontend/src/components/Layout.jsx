import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', icon: '⊞', label: 'Dashboard', end: true },
  { to: '/projects', icon: '◈', label: 'Projects' },
  { to: '/my-tasks', icon: '✦', label: 'My Tasks' },
];

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">⚡</div>
          <span>TaskFlow</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {NAV.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" title="Logout" onClick={handleLogout}>
            <div className="avatar">{getInitials(user?.name)}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
            <span style={{ color: 'var(--text-3)', fontSize: 14 }}>↪</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <button
            className="btn btn-ghost btn-icon"
            style={{ display: 'none' }}
            onClick={() => setSidebarOpen(true)}
          >☰</button>
          <Outlet context={{ topbarTitle: true }} />
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

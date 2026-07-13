import React from 'react';
import { LogOut, Shield, User as UserIcon, BookOpen } from 'lucide-react';

export default function Navbar({ user, onViewChange, currentView, onLogout }) {
  const homeView = user ? (user.role === 'admin' ? 'admin' : 'courses') : 'auth';

  return (
    <nav className="navbar" aria-label="Primary">
      <button
        type="button"
        className="nav-brand"
        onClick={() => onViewChange(homeView)}
      >
        <span className="brand-mark brand-mark-sm" aria-hidden="true">E</span>
        <span className="nav-brand-text">
          <span className="nav-brand-name">Eistatech</span>
          <span className="nav-brand-sub">MCQ Portal</span>
        </span>
      </button>

      {user && (
        <div className="nav-actions">
          {user.role === 'admin' && (
            <div className="nav-tabs">
              <button
                type="button"
                className={`btn btn-ghost ${currentView === 'admin' ? 'is-active' : ''}`}
                onClick={() => onViewChange('admin')}
              >
                <Shield size={14} aria-hidden="true" />
                Admin
              </button>
              <button
                type="button"
                className={`btn btn-ghost ${currentView === 'courses' || currentView === 'dsa-dashboard' || currentView === 'test' ? 'is-active' : ''}`}
                onClick={() => onViewChange('courses')}
              >
                <BookOpen size={14} aria-hidden="true" />
                Courses
              </button>
            </div>
          )}

          <div className="user-info">
            <UserIcon size={16} aria-hidden="true" />
            <span>{user.username}</span>
            <span className={`role-badge ${user.role}`}>{user.role}</span>
          </div>

          <button type="button" className="btn btn-secondary btn-compact" onClick={onLogout}>
            <LogOut size={14} aria-hidden="true" />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

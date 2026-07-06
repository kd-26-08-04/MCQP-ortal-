import React from 'react';
import { LogOut, Shield, User as UserIcon, BookOpen } from 'lucide-react';

export default function Navbar({ user, onViewChange, currentView, onLogout }) {
  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => onViewChange(user ? (user.role === 'admin' ? 'admin' : 'courses') : 'auth')}>
        <div className="brand-icon">
          <BookOpen size={20} />
        </div>
        <span>MCQ Portal</span>
      </div>

      {user && (
        <div className="nav-actions">
          {user.role === 'admin' && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className={`btn btn-secondary ${currentView === 'admin' ? 'btn-primary' : ''}`}
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                onClick={() => onViewChange('admin')}
              >
                <Shield size={14} />
                Admin Panel
              </button>
              <button
                className={`btn btn-secondary ${currentView === 'courses' || currentView === 'dsa-dashboard' ? 'btn-primary' : ''}`}
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                onClick={() => onViewChange('courses')}
              >
                <BookOpen size={14} />
                Student View
              </button>
            </div>
          )}

          <div className="user-info">
            <UserIcon size={16} />
            <span>{user.username}</span>
            <span className={`role-badge ${user.role}`}>
              {user.role}
            </span>
          </div>

          <button
            className="btn btn-secondary"
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onClick={onLogout}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

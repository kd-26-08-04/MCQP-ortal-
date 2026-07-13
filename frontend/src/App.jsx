import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import Courses from './components/Courses';
import DsaDashboard from './components/DsaDashboard';
import TestWindow from './components/TestWindow';
import AdminPanel from './components/AdminPanel';
import { apiFetch, getApiUrl } from './api';
import {
  LOCAL_DEMO_ENABLED,
  getLocalDemoUserFromToken,
  isLocalDemoToken
} from './localDemo';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [currentView, setCurrentView] = useState('auth');
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [testInstance, setTestInstance] = useState(0);
  const [loading, setLoading] = useState(true);
  const apiUrl = getApiUrl();

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (!storedUser || !storedToken) {
        if (!cancelled) {
          setCurrentView('auth');
          setLoading(false);
        }
        return;
      }

      try {
        // TEMPORARY local demo restore — no API / DB
        if (LOCAL_DEMO_ENABLED && isLocalDemoToken(storedToken)) {
          const demoUser = getLocalDemoUserFromToken(storedToken);
          if (!demoUser) throw new Error('Invalid demo session');
          if (cancelled) return;
          setUser(demoUser);
          setToken(storedToken);
          localStorage.setItem('user', JSON.stringify(demoUser));
          setCurrentView(demoUser.role === 'admin' ? 'admin' : 'courses');
          return;
        }

        let parsedUser;
        try {
          parsedUser = JSON.parse(storedUser);
        } catch {
          throw new Error('Corrupt session');
        }

        try {
          const { data } = await apiFetch('/api/auth/me', { token: storedToken });
          if (cancelled) return;
          setUser(data.user);
          setToken(storedToken);
          localStorage.setItem('user', JSON.stringify(data.user));
          setCurrentView(data.user.role === 'admin' ? 'admin' : 'courses');
        } catch (err) {
          // Backward compatible with backends that do not yet expose /api/auth/me
          if (err.status === 404 || err.status === 0) {
            if (cancelled) return;
            setUser(parsedUser);
            setToken(storedToken);
            setCurrentView(parsedUser.role === 'admin' ? 'admin' : 'courses');
            return;
          }
          throw err;
        }
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        if (!cancelled) {
          setUser(null);
          setToken('');
          setCurrentView('auth');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthSuccess = (authUser, sessionToken) => {
    localStorage.setItem('user', JSON.stringify(authUser));
    localStorage.setItem('token', sessionToken);
    setUser(authUser);
    setToken(sessionToken);
    setCurrentView(authUser.role === 'admin' ? 'admin' : 'courses');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken('');
    setCurrentView('auth');
    setSelectedLevelId(null);
  };

  const handleViewChange = (view) => {
    if (!user && view !== 'auth') return;
    if (user?.role !== 'admin' && view === 'admin') return;
    setCurrentView(view);
  };

  const handleSelectSubject = (subjectId) => {
    if (subjectId === 'dsa') {
      setCurrentView('dsa-dashboard');
    }
  };

  const handleStartTest = (levelId) => {
    setSelectedLevelId(levelId);
    setTestInstance((n) => n + 1);
    setCurrentView('test');
  };

  if (loading) {
    return (
      <div className="boot-screen" role="status" aria-live="polite">
        <div className="boot-spinner" aria-hidden="true" />
        <p>Loading Eistatech Portal…</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar
        user={user}
        onViewChange={handleViewChange}
        currentView={currentView}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {currentView === 'auth' && <Auth onAuthSuccess={handleAuthSuccess} />}

        {currentView === 'courses' && user && (
          <Courses onSelectSubject={handleSelectSubject} token={token} apiUrl={apiUrl} />
        )}

        {currentView === 'dsa-dashboard' && user && (
          <DsaDashboard
            onBack={() => setCurrentView('courses')}
            onStartTest={handleStartTest}
            token={token}
            apiUrl={apiUrl}
          />
        )}

        {currentView === 'test' && user && selectedLevelId != null && (
          <TestWindow
            key={`${selectedLevelId}-${testInstance}`}
            levelId={selectedLevelId}
            onBack={() => setCurrentView('dsa-dashboard')}
            onRetry={() => setTestInstance((n) => n + 1)}
            token={token}
            apiUrl={apiUrl}
          />
        )}

        {currentView === 'admin' && user?.role === 'admin' && (
          <AdminPanel token={token} apiUrl={apiUrl} />
        )}
      </main>
    </div>
  );
}

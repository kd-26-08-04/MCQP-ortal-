import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import Courses from './components/Courses';
import DsaDashboard from './components/DsaDashboard';
import TestWindow from './components/TestWindow';
import AdminPanel from './components/AdminPanel';

const API_URL = 'http://localhost:5000';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [currentView, setCurrentView] = useState('auth'); // 'auth', 'courses', 'dsa-dashboard', 'test', 'admin'
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setToken(storedToken);
      
      // Default views based on user roles
      if (parsedUser.role === 'admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('courses');
      }
    } else {
      setCurrentView('auth');
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (authUser, sessionToken) => {
    localStorage.setItem('user', JSON.stringify(authUser));
    localStorage.setItem('token', sessionToken);
    
    setUser(authUser);
    setToken(sessionToken);

    if (authUser.role === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('courses');
    }
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
    setCurrentView(view);
  };

  const handleSelectSubject = (subjectId, subjectName) => {
    if (subjectId === 'dsa') {
      setCurrentView('dsa-dashboard');
    }
  };

  const handleStartTest = (levelId) => {
    setSelectedLevelId(levelId);
    setCurrentView('test');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fafafa' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#4b5563' }}>Loading MCQ Portal...</div>
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
        {currentView === 'auth' && (
          <Auth 
            onAuthSuccess={handleAuthSuccess} 
            apiUrl={API_URL} 
          />
        )}

        {currentView === 'courses' && (
          <Courses 
            onSelectSubject={handleSelectSubject} 
            token={token} 
            apiUrl={API_URL} 
          />
        )}

        {currentView === 'dsa-dashboard' && (
          <DsaDashboard 
            onBack={() => setCurrentView('courses')} 
            onStartTest={handleStartTest} 
            token={token} 
            apiUrl={API_URL} 
          />
        )}

        {currentView === 'test' && (
          <TestWindow 
            levelId={selectedLevelId} 
            onBack={() => setCurrentView('dsa-dashboard')} 
            token={token} 
            apiUrl={API_URL} 
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel 
            token={token} 
            apiUrl={API_URL} 
          />
        )}
      </main>
    </div>
  );
}

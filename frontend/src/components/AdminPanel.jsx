import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Download, FileText, Award } from 'lucide-react';

export default function AdminPanel({ token, apiUrl }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetch(`${apiUrl}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load admin statistics');
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [apiUrl, token]);

  const handleDownloadPdf = async (studentId, username) => {
    setDownloadingId(studentId);
    try {
      const response = await fetch(`${apiUrl}/api/admin/reports/${studentId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate student PDF report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${username}_DSA.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading Admin Statistics...</div>
      </div>
    );
  }

  if (error) {
    return <div className="alert-message error">{error}</div>;
  }

  return (
    <div className="fade-in">
      <div className="welcome-header">
        <h1 className="welcome-title">Administrator Console</h1>
        <p className="welcome-subtitle">Overview student levels, performance records, and export completion certificates.</p>
      </div>

      {/* Summary statistics widgets */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon students">
            <Users size={24} />
          </div>
          <div>
            <div className="stat-label">Total Registered Students</div>
            <div className="stat-value">{stats.totalStudents}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon subjects">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-label">Active Test Subjects</div>
            <div className="stat-value">{stats.totalSubjects}</div>
          </div>
        </div>
      </div>

      {/* Students performance detail table */}
      <div className="admin-table-container">
        <div className="table-header-block">
          <h2 className="table-title">Student Performance Track</h2>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
            Data updated in real-time
          </span>
        </div>

        {stats.students.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
            No student results registered yet.
          </div>
        ) : (
          <table className="performance-table">
            <thead>
              <tr>
                <th>Student Details</th>
                <th>Stages (1 - 10)</th>
                <th>Total Completed</th>
                <th>Score (Out of 100)</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.students.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div className="student-name-cell">{student.username}</div>
                    <div className="student-email-cell">{student.email}</div>
                  </td>
                  <td>
                    <div className="progress-pill-container">
                      {Array.from({ length: 10 }, (_, i) => {
                        const levelNum = i + 1;
                        const levelProg = student.progress.find(p => p.level === levelNum);
                        
                        let statusClass = 'locked';
                        let symbol = 'L';
                        
                        if (levelProg) {
                          statusClass = levelProg.status;
                          if (levelProg.status === 'completed') symbol = 'C';
                          else if (levelProg.status === 'unlocked') symbol = 'U';
                        } else if (levelNum === 1) {
                          statusClass = 'unlocked';
                          symbol = 'U';
                        }
                        
                        return (
                          <div 
                            key={levelNum} 
                            className={`progress-pill ${statusClass}`}
                            title={`Level ${levelNum}: ${statusClass.toUpperCase()} ${levelProg && levelProg.status === 'completed' ? `(Score: ${levelProg.score}/20)` : ''}`}
                          >
                            {levelNum}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                      {student.levelsCompleted} / 10
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, color: 'hsl(var(--primary))' }}>
                      <Award size={14} />
                      {student.totalMarks.toFixed(1)}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      onClick={() => handleDownloadPdf(student.id, student.username)}
                      disabled={downloadingId === student.id}
                    >
                      <Download size={14} />
                      {downloadingId === student.id ? 'Exporting...' : 'PDF Report'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Download, Award } from 'lucide-react';
import { apiFetch, getApiUrl } from '../api';
import { LOCAL_DEMO_ENABLED, isLocalDemoToken } from '../localDemo';

export default function AdminPanel({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch('/api/admin/stats', { token })
      .then(({ data }) => {
        if (cancelled) return;
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load admin statistics');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleDownloadPdf = async (studentId, username) => {
    if (LOCAL_DEMO_ENABLED && isLocalDemoToken(token)) {
      setError('PDF export needs the live backend. Local demo mode cannot generate PDFs.');
      return;
    }

    setDownloadingId(studentId);
    setError('');
    try {
      const response = await fetch(`${getApiUrl()}/api/admin/reports/${studentId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to generate student PDF report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${username}_DSA.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const message = err.message === 'Failed to fetch'
        ? 'Could not reach the API. Check that the backend is online and CORS allows this site.'
        : err.message;
      setError(message);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return <div className="state-block" role="status">Loading admin statistics…</div>;
  }

  if (error && !stats) {
    return <div className="alert-message error" role="alert">{error}</div>;
  }

  return (
    <div className="fade-in">
      <header className="welcome-header">
        <p className="eyebrow">Administration</p>
        <h1 className="welcome-title">Student performance</h1>
        <p className="welcome-subtitle">
          Review level progress and export PDF reports.
        </p>
      </header>

      {error && (
        <div className="alert-message error" role="alert">{error}</div>
      )}

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon students" aria-hidden="true">
            <Users size={24} />
          </div>
          <div>
            <div className="stat-label">Students</div>
            <div className="stat-value">{stats.totalStudents}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon subjects" aria-hidden="true">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-label">Active subjects</div>
            <div className="stat-value">{stats.totalSubjects}</div>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <div className="table-header-block">
          <h2 className="table-title">Performance track</h2>
          <span className="table-meta">
            {LOCAL_DEMO_ENABLED && isLocalDemoToken(token) ? 'Local demo data' : 'Live from database'}
          </span>
        </div>

        {stats.students.length === 0 ? (
          <div className="empty-state">No students registered yet.</div>
        ) : (
          <div className="table-scroll">
            <table className="performance-table">
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Stages</th>
                  <th scope="col">Completed</th>
                  <th scope="col">Score / 100</th>
                  <th scope="col" className="text-right">Actions</th>
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
                      <div className="progress-pill-container" aria-label={`${student.username} level status`}>
                        {Array.from({ length: 10 }, (_, i) => {
                          const levelNum = i + 1;
                          const levelProg = (student.progress || []).find((p) => p.level === levelNum);

                          let statusClass = 'locked';
                          if (levelProg) {
                            statusClass = levelProg.status;
                          } else if (levelNum === 1) {
                            statusClass = 'unlocked';
                          }

                          const title =
                            levelProg && levelProg.status === 'completed'
                              ? `Level ${levelNum}: completed (${levelProg.score}/${levelProg.totalQuestions || 10})`
                              : `Level ${levelNum}: ${statusClass}`;

                          return (
                            <div
                              key={levelNum}
                              className={`progress-pill ${statusClass}`}
                              title={title}
                            >
                              {levelNum}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <span className="completed-count">{student.levelsCompleted} / 10</span>
                    </td>
                    <td>
                      <div className="score-cell">
                        <Award size={14} aria-hidden="true" />
                        {Number(student.totalMarks || 0).toFixed(1)}
                      </div>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn btn-secondary btn-compact"
                        onClick={() => handleDownloadPdf(student.id, student.username)}
                        disabled={downloadingId === student.id}
                      >
                        <Download size={14} aria-hidden="true" />
                        {downloadingId === student.id ? 'Exporting…' : 'PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

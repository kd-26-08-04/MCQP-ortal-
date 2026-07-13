import React, { useState, useEffect, useMemo } from 'react';
import { Users, BookOpen, Download, Award, RotateCcw, Plus, Trash2, Pencil, Search } from 'lucide-react';
import { apiFetch, getApiUrl } from '../api';
import { BRANCHES } from '../constants';

const EMPTY_FORM = {
  level: 1,
  questionText: '',
  options: ['', '', '', ''],
  correctOptionIndex: 0
};

export default function AdminPanel({ token }) {
  const [tab, setTab] = useState('students');
  const [stats, setStats] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [filterLevel, setFilterLevel] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadStats = async () => {
    const { data } = await apiFetch('/api/admin/stats', { token });
    setStats(data);
  };

  const loadQuestions = async (level = filterLevel) => {
    const query = level === 'all' ? '' : `?level=${level}`;
    const { data } = await apiFetch(`/api/admin/questions${query}`, { token });
    setQuestions(data.questions || []);
  };

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const { data } = await apiFetch('/api/admin/stats', { token });
        if (!cancelled) {
          setStats(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load admin statistics');
          setLoading(false);
        }
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (tab !== 'questions') return;
    let cancelled = false;
    setError('');

    const query = filterLevel === 'all' ? '' : `?level=${filterLevel}`;
    apiFetch(`/api/admin/questions${query}`, { token })
      .then(({ data }) => {
        if (!cancelled) setQuestions(data.questions || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, filterLevel, token]);

  const filteredStudents = useMemo(() => {
    if (!stats?.students) return [];
    const q = search.trim().toLowerCase();

    let list = stats.students.filter((s) => {
      const matchesSearch =
        !q ||
        s.username?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.branch?.toLowerCase().includes(q);
      const matchesBranch = filterBranch === 'all' || s.branch === filterBranch;
      const matchesYear = filterYear === 'all' || String(s.year) === String(filterYear);
      return matchesSearch && matchesBranch && matchesYear;
    });

    const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
    list = [...list].sort((a, b) => {
      if (sortBy === 'branch') {
        const cmp = collator.compare(a.branch || 'zzz', b.branch || 'zzz');
        return cmp !== 0 ? cmp : collator.compare(a.username || '', b.username || '');
      }
      if (sortBy === 'year') {
        const ay = a.year ?? 99;
        const by = b.year ?? 99;
        if (ay !== by) return ay - by;
        const sem = (a.semester ?? 99) - (b.semester ?? 99);
        return sem !== 0 ? sem : collator.compare(a.username || '', b.username || '');
      }
      // name (default)
      return collator.compare(a.username || '', b.username || '');
    });

    return list;
  }, [stats, search, sortBy, filterBranch, filterYear]);

  const handleDownloadPdf = async (studentId, username) => {
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
      const msg = err.message === 'Failed to fetch'
        ? 'Could not reach the API. Check that the backend is online and CORS allows this site.'
        : err.message;
      setError(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleResetProgress = async (studentId, username) => {
    const ok = window.confirm(`Reset ALL DSA progress for ${username}? This cannot be undone.`);
    if (!ok) return;
    setError('');
    setMessage('');
    try {
      await apiFetch(`/api/admin/students/${studentId}/reset-progress`, {
        method: 'POST',
        token,
        body: JSON.stringify({})
      });
      setMessage(`Progress reset for ${username}.`);
      await loadStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (question) => {
    setEditingId(question._id);
    setForm({
      level: question.level,
      questionText: question.questionText,
      options: [...question.options],
      correctOptionIndex: question.correctOptionIndex
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (editingId) {
        await apiFetch(`/api/admin/questions/${editingId}`, {
          method: 'PUT',
          token,
          body: JSON.stringify(form)
        });
        setMessage('Question updated.');
      } else {
        await apiFetch('/api/admin/questions', {
          method: 'POST',
          token,
          body: JSON.stringify(form)
        });
        setMessage('Question created.');
      }
      resetForm();
      await loadQuestions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    setError('');
    try {
      await apiFetch(`/api/admin/questions/${id}`, { method: 'DELETE', token });
      setMessage('Question deleted.');
      if (editingId === id) resetForm();
      await loadQuestions();
    } catch (err) {
      setError(err.message);
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
        <h1 className="welcome-title">Admin console</h1>
        <p className="welcome-subtitle">
          Track students, manage the DSA question bank, and export reports.
        </p>
      </header>

      <div className="admin-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'students'}
          className={`btn btn-ghost ${tab === 'students' ? 'is-active' : ''}`}
          onClick={() => setTab('students')}
        >
          <Users size={14} aria-hidden="true" /> Students
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'questions'}
          className={`btn btn-ghost ${tab === 'questions' ? 'is-active' : ''}`}
          onClick={() => setTab('questions')}
        >
          <BookOpen size={14} aria-hidden="true" /> Questions
        </button>
      </div>

      {error && <div className="alert-message error" role="alert">{error}</div>}
      {message && <div className="alert-message success" role="status">{message}</div>}

      {tab === 'students' && stats && (
        <>
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
            <div className="table-header-block table-header-stack">
              <h2 className="table-title">Performance track</h2>
              <div className="student-controls">
                <div className="search-field">
                  <Search size={14} aria-hidden="true" />
                  <input
                    type="search"
                    className="form-input search-input"
                    placeholder="Search name, email, branch"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search students"
                  />
                </div>
                <select
                  className="form-input level-filter"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort students"
                >
                  <option value="name">Sort: Name</option>
                  <option value="branch">Sort: Branch</option>
                  <option value="year">Sort: Year / Semester</option>
                </select>
                <select
                  className="form-input level-filter"
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  aria-label="Filter by branch"
                >
                  <option value="all">All branches</option>
                  {(stats.branches || BRANCHES).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <select
                  className="form-input level-filter"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  aria-label="Filter by year"
                >
                  <option value="all">All years</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="empty-state">No matching students.</div>
            ) : (
              <div className="table-scroll">
                <table className="performance-table">
                  <thead>
                    <tr>
                      <th scope="col">Student</th>
                      <th scope="col">Branch</th>
                      <th scope="col">Sem / Year</th>
                      <th scope="col">Stages</th>
                      <th scope="col">Completed</th>
                      <th scope="col">Score / 100</th>
                      <th scope="col" className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <div className="student-name-cell">{student.username}</div>
                          <div className="student-email-cell">{student.email}</div>
                        </td>
                        <td>
                          <span className="completed-count">{student.branch || '—'}</span>
                        </td>
                        <td>
                          <span className="completed-count">
                            {student.semester != null ? `Sem ${student.semester}` : '—'}
                            {student.year != null ? ` · Y${student.year}` : ''}
                          </span>
                        </td>
                        <td>
                          <div className="progress-pill-container">
                            {Array.from({ length: 10 }, (_, i) => {
                              const levelNum = i + 1;
                              const levelProg = (student.progress || []).find((p) => p.level === levelNum);
                              let statusClass = 'locked';
                              if (levelProg) statusClass = levelProg.status;
                              else if (levelNum === 1) statusClass = 'unlocked';
                              return (
                                <div key={levelNum} className={`progress-pill ${statusClass}`} title={`Level ${levelNum}: ${statusClass}`}>
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
                        <td className="text-right action-cell">
                          <button
                            type="button"
                            className="btn btn-secondary btn-compact"
                            onClick={() => handleDownloadPdf(student.id, student.username)}
                            disabled={downloadingId === student.id}
                          >
                            <Download size={14} aria-hidden="true" />
                            {downloadingId === student.id ? '…' : 'PDF'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-compact"
                            onClick={() => handleResetProgress(student.id, student.username)}
                          >
                            <RotateCcw size={14} aria-hidden="true" />
                            Reset
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'questions' && (
        <div className="admin-questions">
          <form className="question-form card-surface" onSubmit={handleSaveQuestion}>
            <h2 className="table-title">{editingId ? 'Edit question' : 'Add question'}</h2>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="q-level">Level</label>
                <select
                  id="q-level"
                  className="form-input"
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: Number(e.target.value) }))}
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Level {i + 1}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="q-correct">Correct option</label>
                <select
                  id="q-correct"
                  className="form-input"
                  value={form.correctOptionIndex}
                  onChange={(e) => setForm((f) => ({ ...f, correctOptionIndex: Number(e.target.value) }))}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="q-text">Question</label>
              <textarea
                id="q-text"
                className="form-input form-textarea"
                rows={3}
                value={form.questionText}
                onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))}
                required
              />
            </div>

            <div className="options-editor">
              {form.options.map((opt, idx) => (
                <div className="form-group" key={idx}>
                  <label className="form-label" htmlFor={`opt-${idx}`}>Option {String.fromCharCode(65 + idx)}</label>
                  <input
                    id={`opt-${idx}`}
                    className="form-input"
                    value={opt}
                    onChange={(e) => {
                      const next = [...form.options];
                      next[idx] = e.target.value;
                      setForm((f) => ({ ...f, options: next }));
                    }}
                    required
                  />
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Plus size={14} aria-hidden="true" />
                {saving ? 'Saving…' : editingId ? 'Update question' : 'Add question'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <div className="admin-table-container">
            <div className="table-header-block">
              <h2 className="table-title">Question bank ({questions.length})</h2>
              <select
                className="form-input level-filter"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                aria-label="Filter by level"
              >
                <option value="all">All levels</option>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>Level {i + 1}</option>
                ))}
              </select>
            </div>

            {questions.length === 0 ? (
              <div className="empty-state">No questions for this filter. Run seed or add questions above.</div>
            ) : (
              <ul className="question-admin-list">
                {questions.map((question) => (
                  <li key={question._id} className="question-admin-item">
                    <div>
                      <span className="badge-status unlocked">L{question.level}</span>
                      <p className="question-admin-text">{question.questionText}</p>
                      <p className="student-email-cell">
                        Correct: {String.fromCharCode(65 + question.correctOptionIndex)}. {question.options[question.correctOptionIndex]}
                      </p>
                    </div>
                    <div className="action-cell">
                      <button type="button" className="btn btn-secondary btn-compact" onClick={() => startEdit(question)}>
                        <Pencil size={14} aria-hidden="true" /> Edit
                      </button>
                      <button type="button" className="btn btn-secondary btn-compact" onClick={() => handleDeleteQuestion(question._id)}>
                        <Trash2 size={14} aria-hidden="true" /> Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

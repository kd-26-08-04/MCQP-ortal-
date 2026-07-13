import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Unlock, CheckCircle2, PlayCircle, Award } from 'lucide-react';
import { apiFetch } from '../api';
import { scaleLevelScore, totalScaledMarks } from '../utils/scoring';

export default function DsaDashboard({ onBack, onStartTest, token }) {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    apiFetch('/api/levels/dsa', { token })
      .then(({ data }) => {
        if (cancelled) return;
        setLevels(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return <div className="state-block" role="status">Loading DSA levels…</div>;
  }

  if (error) {
    return <div className="alert-message error" role="alert">{error}</div>;
  }

  const completedLevels = levels.filter((l) => l.status === 'completed').length;
  const marks = totalScaledMarks(levels);

  return (
    <div className="fade-in">
      <button type="button" className="dsa-header" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Back to courses</span>
      </button>

      <header className="welcome-header dsa-welcome">
        <div>
          <p className="eyebrow">Computer Science</p>
          <h1 className="welcome-title welcome-title-sm">Data Structures &amp; Algorithms</h1>
          <p className="welcome-subtitle">
            Pass each level (minimum 50%) to unlock the next stage.
          </p>
        </div>
        <div className="metrics-bar" aria-label="Progress summary">
          <div className="metric">
            <div className="metric-label">Unlocked</div>
            <div className="metric-value accent">
              {levels.filter((l) => l.status !== 'locked').length} / 10
            </div>
          </div>
          <div className="metric">
            <div className="metric-label">Completed</div>
            <div className="metric-value success">{completedLevels} / 10</div>
          </div>
          <div className="metric">
            <div className="metric-label">Total marks</div>
            <div className="metric-value accent metric-value-inline">
              <Award size={18} aria-hidden="true" />
              {marks.toFixed(1)}/100
            </div>
          </div>
        </div>
      </header>

      <div className="levels-grid">
        {levels.map((lvl) => {
          const isLocked = lvl.status === 'locked';
          const isCompleted = lvl.status === 'completed';
          const isUnlocked = lvl.status === 'unlocked';
          const totalQ = lvl.totalQuestions || 10;
          const scaled = scaleLevelScore(lvl.score, totalQ).toFixed(1);

          return (
            <article key={lvl.level} className={`level-card ${lvl.status}`}>
              <div className="level-number">Stage {lvl.level}</div>

              <div className="level-icon-container" aria-hidden="true">
                {isCompleted ? (
                  <CheckCircle2 size={24} />
                ) : isUnlocked ? (
                  <Unlock size={24} />
                ) : (
                  <Lock size={20} />
                )}
              </div>

              <div>
                <div className="level-score">
                  {isCompleted ? (
                    <span className="level-score high">
                      Score: {lvl.score}/{totalQ} ({scaled}/10)
                    </span>
                  ) : isUnlocked ? (
                    <span className="level-score ready">Ready to start</span>
                  ) : (
                    <span className="level-score locked-text">Locked</span>
                  )}
                </div>
                <div className="level-badge-wrap">
                  <span className={`badge-status ${lvl.status}`}>{lvl.status}</span>
                </div>
              </div>

              {!isLocked ? (
                <button
                  type="button"
                  className={`btn btn-block ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => onStartTest(lvl.level)}
                >
                  <PlayCircle size={14} aria-hidden="true" />
                  {isCompleted ? 'Retake test' : 'Start test'}
                </button>
              ) : (
                <button type="button" className="btn btn-secondary btn-block" disabled>
                  <Lock size={12} aria-hidden="true" />
                  Locked
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

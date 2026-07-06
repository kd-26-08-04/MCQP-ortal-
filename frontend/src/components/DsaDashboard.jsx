import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Unlock, CheckCircle2, PlayCircle, Award } from 'lucide-react';

export default function DsaDashboard({ onBack, onStartTest, token, apiUrl }) {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLevels = () => {
    fetch(`${apiUrl}/api/levels/dsa`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch level progress');
        return res.json();
      })
      .then(data => {
        setLevels(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLevels();
  }, [apiUrl, token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading DSA Levels...</div>
      </div>
    );
  }

  if (error) {
    return <div className="alert-message error">{error}</div>;
  }

  // Calculate metrics
  const completedLevels = levels.filter(l => l.status === 'completed').length;
  let totalScoreScaled = 0;
  levels.forEach(l => {
    if (l.status === 'completed') {
      totalScoreScaled += (l.score / 2); // each level score is out of 20, scaled is out of 10
    }
  });

  return (
    <div className="fade-in">
      <div className="dsa-header" onClick={onBack}>
        <ArrowLeft size={16} />
        <span>Back to Course Selection</span>
      </div>

      <div className="welcome-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 className="welcome-title" style={{ fontSize: '1.8rem' }}>Data Structures & Algorithms (DSA)</h1>
          <p className="welcome-subtitle">Pass each level test (minimum 10/20 marks) to unlock the subsequent level.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'hsl(var(--card))', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ textAlign: 'center', borderRight: '1px solid hsl(var(--border))', paddingRight: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Unlocked</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'hsl(var(--primary))' }}>
              {levels.filter(l => l.status !== 'locked').length} / 10
            </div>
          </div>
          <div style={{ textAlign: 'center', borderRight: '1px solid hsl(var(--border))', paddingRight: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Completed</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'hsl(var(--success))' }}>
              {completedLevels} / 10
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Total Marks</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Award size={18} />
              {totalScoreScaled.toFixed(1)}/100
            </div>
          </div>
        </div>
      </div>

      <div className="levels-grid">
        {levels.map((lvl) => {
          const isLocked = lvl.status === 'locked';
          const isCompleted = lvl.status === 'completed';
          const isUnlocked = lvl.status === 'unlocked';

          return (
            <div key={lvl.level} className={`level-card ${lvl.status}`}>
              <div className="level-number">Stage {lvl.level}</div>

              <div className="level-icon-container">
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
                    <span className="level-score high">Score: {lvl.score}/20 ({(lvl.score / 2).toFixed(1)}/10)</span>
                  ) : isUnlocked ? (
                    <span style={{ color: 'hsl(var(--warning))' }}>Ready to Start</span>
                  ) : (
                    <span className="level-score locked-text">Locked</span>
                  )}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <span className={`badge-status ${lvl.status}`}>{lvl.status}</span>
                </div>
              </div>

              {!isLocked ? (
                <button
                  className={`btn btn-block ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => onStartTest(lvl.level)}
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                >
                  <PlayCircle size={14} />
                  {isCompleted ? 'Re-take Test' : 'Start Test'}
                </button>
              ) : (
                <button
                  className="btn btn-secondary btn-block"
                  disabled
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', opacity: 0.5, cursor: 'not-allowed' }}
                >
                  <Lock size={12} />
                  Locked
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

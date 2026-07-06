import React, { useState, useEffect, useRef } from 'react';
import { Timer, ArrowRight, ArrowLeft, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function TestWindow({ levelId, onBack, token, apiUrl }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedIndex }
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes (1200 seconds)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const timerRef = useRef(null);
  const autoSubmitRef = useRef(false);

  useEffect(() => {
    // Fetch test questions
    fetch(`${apiUrl}/api/levels/dsa/${levelId}/test`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load assessment test');
        return res.json();
      })
      .then(data => {
        setQuestions(data.questions);
        setTimeLeft(data.timeLimitMinutes * 60);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });

    // Cleanup timer
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [apiUrl, token, levelId]);

  // Start timer once questions are loaded
  useEffect(() => {
    if (loading || submitted || questions.length === 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!autoSubmitRef.current) {
            autoSubmitRef.current = true;
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, submitted, questions]);

  const handleSelectOption = (questionId, optionIdx) => {
    if (submitted) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const handleAutoSubmit = () => {
    // Directly submit current answers state
    handleSubmit(null, true);
  };

  const handleSubmit = async (e, isTimeUp = false) => {
    if (e) e.preventDefault();
    if (submitted) return;

    setSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const response = await fetch(`${apiUrl}/api/levels/dsa/${levelId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Submission failed');
      }

      setResult({
        ...data,
        isTimeUp
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading assessment test...</div>
      </div>
    );
  }

  if (error && !submitted) {
    return (
      <div className="test-page-container fade-in">
        <div className="alert-message error">{error}</div>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  // Result view after submission
  if (result) {
    const isPass = result.passed;
    const score = result.score;
    const totalQ = result.totalQuestions;
    const scaledMarks = ((score / totalQ) * 10).toFixed(1);
    const passThreshold = Math.ceil(totalQ / 2);
    
    return (
      <div className="result-card fade-in">
        <div className={`result-icon ${isPass ? 'pass' : 'fail'}`}>
          {isPass ? <CheckCircle2 size={42} /> : <XCircle size={42} />}
        </div>
        
        <h2 className="result-title">
          {result.isTimeUp ? 'Time Expired! ' : ''}
          {isPass ? 'Assessment Passed!' : 'Assessment Failed'}
        </h2>
        
        <p className="result-percent">Level {levelId} Results</p>
        
        <div className="result-score">
          {score} / {totalQ}
        </div>
        <p className="result-percent" style={{ marginTop: '-1rem', fontSize: '1.1rem', fontWeight: 600 }}>
          Weighted Score: {scaledMarks} / 10 marks
        </p>

        <p className="result-message">
          {isPass 
            ? `Excellent job! You have scored ${score} out of ${totalQ} questions (minimum required is ${passThreshold}/${totalQ}). The next level has been successfully unlocked.` 
            : `You scored less than 50% (${passThreshold}/${totalQ}). Please review your concepts and attempt the level again to unlock the next stages.`}
        </p>

        <div className="result-actions">
          <button className="btn btn-secondary" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          {!isPass && (
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              <RefreshCw size={16} /> Retry Level
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;
  const isTimeUrgent = timeLeft < 120; // less than 2 minutes

  return (
    <div className="test-page-container fade-in">
      <div className="test-header-bar">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>DSA assessment - Level {levelId}</h2>
          <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>
            Answered: {Object.keys(answers).length} / {totalQuestions}
          </span>
        </div>
        
        <div className={`test-timer ${isTimeUrgent ? 'danger' : ''}`}>
          <Timer size={18} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Grid of question navigation buttons */}
      <div className="question-nav">
        {questions.map((q, idx) => {
          const isAnswered = answers[q._id] !== undefined;
          const isActive = idx === currentIdx;
          let className = 'q-nav-btn';
          if (isAnswered) className += ' answered';
          if (isActive) className += ' active';
          
          return (
            <button 
              key={q._id} 
              className={className}
              onClick={() => setCurrentIdx(idx)}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {currentQuestion && (
        <div className="question-card fade-in" key={currentQuestion._id}>
          <div className="question-header">
            <span className="question-number">Question {currentIdx + 1} of {totalQuestions}</span>
            <span className="question-marks">1 Mark</span>
          </div>

          <p className="question-text">{currentQuestion.questionText}</p>

          <div className="options-list">
            {currentQuestion.options.map((option, oIdx) => {
              const letter = String.fromCharCode(65 + oIdx); // A, B, C, D
              const isSelected = answers[currentQuestion._id] === oIdx;

              return (
                <button
                  key={oIdx}
                  className={`option-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(currentQuestion._id, oIdx)}
                >
                  <div className="option-letter">{letter}</div>
                  <div>{option}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="test-navigation-footer">
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
          style={{ opacity: currentIdx === 0 ? 0.5 : 1 }}
        >
          <ArrowLeft size={16} /> Prev
        </button>

        {currentIdx < totalQuestions - 1 ? (
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentIdx(prev => Math.min(totalQuestions - 1, prev + 1))}
          >
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button
            className="btn btn-success"
            onClick={(e) => {
              if (window.confirm('Are you sure you want to submit the test?')) {
                handleSubmit(e);
              }
            }}
          >
            <CheckCircle2 size={16} /> Submit Assessment
          </button>
        )}
      </div>
    </div>
  );
}

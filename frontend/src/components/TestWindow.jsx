import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { apiFetch } from '../api';
import { scaleLevelScore, passThreshold } from '../utils/scoring';

export default function TestWindow({ levelId, onBack, onRetry, token, apiUrl }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1200);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const timerRef = useRef(null);
  const answersRef = useRef({});
  const submittedRef = useRef(false);
  const submitAnswersRef = useRef(async () => {});

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    let cancelled = false;

    apiFetch(`/api/levels/dsa/${levelId}/test`, { token })
      .then(({ data }) => {
        if (cancelled) return;
        setQuestions(data.questions);
        setTimeLeft((data.timeLimitMinutes || 20) * 60);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [apiUrl, token, levelId]);

  const submitAnswers = async (isTimeUp = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);
    setSubmitting(true);

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const { data } = await apiFetch(`/api/levels/dsa/${levelId}/submit`, {
        method: 'POST',
        token,
        body: JSON.stringify({ answers: answersRef.current })
      });
      setResult({ ...data, isTimeUp });
    } catch (err) {
      submittedRef.current = false;
      setSubmitted(false);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    submitAnswersRef.current = submitAnswers;
  });

  useEffect(() => {
    if (loading || submitted || questions.length === 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitAnswersRef.current(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, submitted, questions.length]);

  const handleSelectOption = (questionId, optionIdx) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="state-block" role="status">
        Loading assessment…
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="test-page-container fade-in">
        <div className="alert-message error" role="alert">{error}</div>
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to dashboard
        </button>
      </div>
    );
  }

  if (result) {
    const isPass = result.passed;
    const score = result.score;
    const totalQ = result.totalQuestions;
    const scaledMarks = scaleLevelScore(score, totalQ).toFixed(1);
    const threshold = passThreshold(totalQ);

    return (
      <div className="result-card fade-in">
        <div className={`result-icon ${isPass ? 'pass' : 'fail'}`} aria-hidden="true">
          {isPass ? <CheckCircle2 size={42} /> : <XCircle size={42} />}
        </div>

        <h2 className="result-title">
          {result.isTimeUp ? 'Time expired — ' : ''}
          {isPass ? 'Assessment passed' : 'Assessment failed'}
        </h2>

        <p className="result-percent">Level {levelId} results</p>

        <div className="result-score">
          {score} / {totalQ}
        </div>
        <p className="result-percent" style={{ marginTop: '-1rem', fontSize: '1.1rem', fontWeight: 600 }}>
          Weighted score: {scaledMarks} / 10
        </p>

        <p className="result-message">
          {isPass
            ? `You scored ${score} of ${totalQ} (needed ${threshold}). ${result.nextLevelUnlocked ? 'The next level is now unlocked.' : 'Keep going through the remaining stages.'}`
            : `You scored below 50% (needed ${threshold}/${totalQ}). Review the material and try again to unlock the next stage.`}
        </p>

        <div className="result-actions">
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            <ArrowLeft size={16} aria-hidden="true" /> Back to dashboard
          </button>
          {!isPass && (
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              <RefreshCw size={16} aria-hidden="true" /> Retry level
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;
  const isTimeUrgent = timeLeft < 120;

  return (
    <div className="test-page-container fade-in">
      <div className="test-header-bar">
        <div>
          <h2 className="test-heading">DSA assessment — Level {levelId}</h2>
          <span className="test-meta">
            Answered: {Object.keys(answers).length} / {totalQuestions}
          </span>
        </div>

        <div
          className={`test-timer ${isTimeUrgent ? 'danger' : ''}`}
          role="timer"
          aria-live="polite"
          aria-atomic="true"
        >
          <Timer size={18} aria-hidden="true" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="question-nav" role="navigation" aria-label="Question navigator">
        {questions.map((q, idx) => {
          const isAnswered = answers[q._id] !== undefined;
          const isActive = idx === currentIdx;
          let className = 'q-nav-btn';
          if (isAnswered) className += ' answered';
          if (isActive) className += ' active';

          return (
            <button
              key={q._id}
              type="button"
              className={className}
              onClick={() => setCurrentIdx(idx)}
              aria-current={isActive ? 'true' : undefined}
              aria-label={`Question ${idx + 1}${isAnswered ? ', answered' : ''}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {currentQuestion && (
        <div className="question-card" key={currentQuestion._id}>
          <div className="question-header">
            <span className="question-number">
              Question {currentIdx + 1} of {totalQuestions}
            </span>
            <span className="question-marks">1 mark</span>
          </div>

          <p className="question-text">{currentQuestion.questionText}</p>

          <div className="options-list" role="radiogroup" aria-label={`Options for question ${currentIdx + 1}`}>
            {currentQuestion.options.map((option, oIdx) => {
              const letter = String.fromCharCode(65 + oIdx);
              const isSelected = answers[currentQuestion._id] === oIdx;

              return (
                <button
                  key={oIdx}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`option-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(currentQuestion._id, oIdx)}
                >
                  <div className="option-letter" aria-hidden="true">{letter}</div>
                  <div>{option}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="test-navigation-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
        >
          <ArrowLeft size={16} aria-hidden="true" /> Prev
        </button>

        {currentIdx < totalQuestions - 1 ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
          >
            Next <ArrowRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-success"
            disabled={submitting}
            onClick={() => {
              if (window.confirm('Submit this assessment now?')) {
                submitAnswers(false);
              }
            }}
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            {submitting ? 'Submitting…' : 'Submit assessment'}
          </button>
        )}
      </div>
    </div>
  );
}

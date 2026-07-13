import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { apiFetch } from '../api';
import { BRANCHES, SEMESTERS, academicYearFromSemester } from '../constants';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [semester, setSemester] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin
      ? { email, password }
      : { username, email, password, branch, semester: Number(semester) };

    try {
      const { data } = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      onAuthSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (loginMode) => {
    setIsLogin(loginMode);
    setError('');
  };

  const yearLabel = academicYearFromSemester(Number(semester));

  return (
    <div className="auth-page fade-in">
      <div className="auth-card">
        <div className="brand-mark" aria-hidden="true">
          <span>E</span>
        </div>
        <div className="auth-header">
          <p className="brand-eyebrow">Eistatech</p>
          <h1 className="auth-title">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="auth-subtitle">
            {isLogin
              ? 'Sign in with your email (or admin ID) to continue.'
              : 'Register with your branch and semester (1–8) to start DSA tests.'}
          </p>
        </div>

        {error && (
          <div className="alert-message error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-username">Username</label>
              <input
                id="auth-username"
                type="text"
                className="form-input"
                placeholder="jane.doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                minLength={3}
                maxLength={40}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">
              {isLogin ? 'Email or admin ID' : 'Email'}
            </label>
            <input
              id="auth-email"
              type="text"
              inputMode="email"
              className="form-input"
              placeholder={isLogin ? 'name@example.com or admin ID' : 'name@example.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className="form-input"
              placeholder={isLogin ? 'Your password' : 'At least 8 characters'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              minLength={isLogin ? undefined : 8}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="auth-branch">Branch</label>
                <select
                  id="auth-branch"
                  className="form-input"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="auth-semester">Semester</label>
                <select
                  id="auth-semester"
                  className="form-input"
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  required
                >
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      Semester {s} (Year {academicYearFromSemester(s)})
                    </option>
                  ))}
                </select>
                <p className="field-hint">Total 8 semesters · currently Year {yearLabel}</p>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {isLogin ? <LogIn size={18} aria-hidden="true" /> : <UserPlus size={18} aria-hidden="true" />}
            {loading ? (isLogin ? 'Signing in…' : 'Creating account…') : (isLogin ? 'Sign in' : 'Create account')}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? (
            <>
              Don&apos;t have an account?{' '}
              <button type="button" className="text-link" onClick={() => switchMode(false)}>
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" className="text-link" onClick={() => switchMode(true)}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

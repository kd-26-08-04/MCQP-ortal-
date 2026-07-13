import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { apiFetch } from '../api';
import { LOCAL_DEMO_ENABLED, LOCAL_DEMO_ACCOUNTS, tryLocalDemoLogin } from '../localDemo';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // TEMPORARY local demo — no backend / DB required
      if (isLogin) {
        const demo = tryLocalDemoLogin(email, password);
        if (demo) {
          onAuthSuccess(demo.user, demo.token);
          return;
        }
      }

      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { email, password }
        : { username, email, password };

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
              ? 'Sign in to continue your assessment path.'
              : 'Register as a student to start DSA level tests.'}
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
            <label className="form-label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              placeholder="name@example.com"
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

        {LOCAL_DEMO_ENABLED && isLogin && (
          <div className="local-demo-hint" role="note">
            <strong>Local demo (no DB)</strong>
            {LOCAL_DEMO_ACCOUNTS.map((account) => (
              <div key={account.email}>
                {account.user.role}: <code>{account.email}</code> / <code>{account.password}</code>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

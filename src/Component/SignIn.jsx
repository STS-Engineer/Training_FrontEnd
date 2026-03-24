import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './../Style/SignIn.css';
import { signIn } from '../api';
import { setSession } from '../session';

const SLIDES = [
  { tag: 'Training Request',    img: 'bg1.webp' },
  { tag: 'Knowledge Transfer',  img: 'bg2.jpg'  },
  { tag: 'Global Reach',        img: 'bg3.jpg' },
  { tag: 'Continuous Learning', img: 'bg4.jpg' },
];

function LeftPanel() {
  const [active, setActive] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    timer.current = setInterval(() => setActive(a => (a + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer.current);
  }, []);

  const s = SLIDES[active];
  return (
    <div
      className="si-left"
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/img/${s.img})` }}
      aria-hidden="true"
    >
      <div className="si-left-overlay" />
      <div className="si-left-content">
        <h2 className="si-left-title">
          Welcome to<br /><span>AVOCarbon Training</span>
        </h2>
        <p className="si-left-sub">
          Sign in to submit and track your training module requests across all AVOCarbon sites worldwide.
        </p>
        <div className="si-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`si-dot${i === active ? ' si-dot-active' : ''}`}
              onClick={() => { setActive(i); clearInterval(timer.current); timer.current = setInterval(() => setActive(a => (a + 1) % SLIDES.length), 5000); }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const response = await signIn(email.trim(), password);
      const raw = response.data ?? response;
      const token  = raw.token;
      const member = raw.member ?? raw.user ?? null;
      console.log('[SignIn] raw response:', raw);
      if (token) {
        setSession(token, member);
        navigate('/dashboard', { replace: true });
      } else {
        setError('Authentication failed: no token received.');
      }
    } catch (err) {
      console.error('[SignIn] error:', err);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="si-page">
      <LeftPanel />

      <div className="si-right">
        <div className="si-card">

          <div className="si-card-brand">
            <img src="/img/logo.PNG" alt="AVOCarbon" className="si-brand-logo" />
            <div className="si-brand-divider" />
            <div className="si-card-header">
              <h1 className="si-card-title">Sign In</h1>
              <p className="si-card-sub">Enter your credentials to access the platform</p>
            </div>
          </div>

          {error && (
            <div className="si-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form className="si-form" onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="si-fg">
              <label className="si-label" htmlFor="si-email">Email address</label>
              <div className="si-input-wrap">
                <svg className="si-input-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  id="si-email"
                  type="email"
                  className="si-input"
                  placeholder="you@avocarbon.com"
                  value={email}
                  autoComplete="email"
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="si-fg">
              <label className="si-label" htmlFor="si-password">Password</label>
              <div className="si-input-wrap">
                <svg className="si-input-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  id="si-password"
                  type={showPw ? 'text' : 'password'}
                  className="si-input si-input-pw"
                  placeholder="••••••••"
                  value={password}
                  autoComplete="new-password"   // ← changé
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                />
                <button
                  type="button"
                  className="si-pw-toggle"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="si-btn" disabled={loading}>
              {loading ? (
                <span className="si-spinner" />
              ) : (
                <>
                  Sign In
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>

          </form>

          <p className="si-footer">
            © {new Date().getFullYear()} AVOCarbon Group · All rights reserved
          </p>

        </div>
      </div>
    </div>
  );
}

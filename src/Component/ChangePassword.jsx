import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './../Style/ChangePassword.css';
import { changePassword } from '../api';
import { getSession } from '../session';

export default function ChangePassword() {
  const navigate = useNavigate();
  const session = getSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Disable native browser password reveal button
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      input[type="password"]::-webkit-password-decoration { display: none !important; }
      input[type="password"]::-webkit-password-revealers,
      input[type="password"]::-webkit-password-revealers-container { display: none !important; }
      input[type="password"]::password-reveal-button { display: none !important; }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!currentPassword.trim()) {
      setError('Please enter your current password.');
      return;
    }
    if (!newPassword.trim()) {
      setError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from current password.');
      return;
    }

    setLoading(true);
    try {
      const { member } = getSession();
      if (!member || !member.id) {
        setError('User session not found. Please log in again.');
        setLoading(false);
        return;
      }
      await changePassword(member.id, currentPassword, newPassword);
      setSuccess('Password changed successfully! You will be redirected to dashboard.');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-page">
      <div className="cp-container">
        <div className="cp-card">
          <div className="cp-header">
            <h1 className="cp-title">Change Password</h1>
            <p className="cp-subtitle">
              Update your password to keep your account secure
            </p>
          </div>

          <form onSubmit={handleSubmit} className="cp-form">
            {/* Current Password */}
            <div className="cp-field">
              <label className="cp-label">Current Password</label>
              <div className="cp-input-wrap">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  className="cp-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  disabled={loading}
                  autoComplete="new-password"
                  spellCheck="false"
                />
                <button
                  type="button"
                  className="cp-toggle-pw"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  tabIndex="-1"
                >
                  {showCurrentPw ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="cp-field">
              <label className="cp-label">New Password</label>
              <div className="cp-input-wrap">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  className="cp-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  disabled={loading}
                  autoComplete="new-password"
                  spellCheck="false"
                />
                <button
                  type="button"
                  className="cp-toggle-pw"
                  onClick={() => setShowNewPw(!showNewPw)}
                  tabIndex="-1"
                >
                  {showNewPw ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="cp-field">
              <label className="cp-label">Confirm New Password</label>
              <div className="cp-input-wrap">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  className="cp-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  disabled={loading}
                  autoComplete="new-password"
                  spellCheck="false"
                />
                <button
                  type="button"
                  className="cp-toggle-pw"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  tabIndex="-1"
                >
                  {showConfirmPw ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && <div className="cp-error">{error}</div>}

            {/* Success Message */}
            {success && <div className="cp-success">{success}</div>}

            {/* Actions */}
            <div className="cp-actions">
              <button
                type="submit"
                className="cp-btn cp-btn-primary"
                disabled={loading}
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
              <button
                type="button"
                className="cp-btn cp-btn-secondary"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

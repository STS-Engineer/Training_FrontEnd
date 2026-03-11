import React, { useState } from 'react';
import { createPortal } from 'react-dom';

export default function RejectReasonModal({ onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const [error,  setError]  = useState(false);

  const handleSubmit = () => {
    if (!reason.trim()) { setError(true); return; }
    onConfirm(reason.trim());
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
    if (e.key === 'Escape') onCancel();
  };

  return createPortal(
    <div className="rj-overlay" onClick={onCancel} onKeyDown={handleKey}>
      <div className="rj-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="rj-header">
          <span className="rj-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </span>
          <h3 className="rj-title">Reject Training Request</h3>
          <button className="rj-close" onClick={onCancel} title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="rj-body">
          <label className="rj-label">
            Reason for rejection <span className="rj-required">*</span>
          </label>
          <textarea
            className={`rj-textarea${error ? ' rj-textarea-err' : ''}`}
            rows={5}
            placeholder="Please explain why this training request is being rejected…"
            value={reason}
            onChange={e => { setReason(e.target.value); setError(false); }}
            autoFocus
          />
          {error && <span className="rj-err-msg">A reason is required.</span>}
          <span className="rj-hint">Tip: Ctrl + Enter to confirm</span>
        </div>

        {/* Footer */}
        <div className="rj-footer">
          <button className="rj-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="rj-btn-confirm" onClick={handleSubmit}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Confirm Reject
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

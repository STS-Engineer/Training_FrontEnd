import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { markTrainingDone } from '../../api';

export default function CompletionModal({ training, onClose, onSuccess }) {
  const [file,    setFile]    = useState(null);
  const [link,    setLink]    = useState('');
  const [summary, setSummary] = useState('');
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState(null);
  const inputRef = useRef();

  const ownerEmails = (training.requesters ?? []).map(r => r.email).filter(Boolean);

  const handleFile = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      await markTrainingDone(training.id, file, {
        link,
        description_done: summary,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message ?? 'An error occurred while sending.');
    } finally {
      setSending(false);
    }
  };

  const ext = file?.name.split('.').pop()?.toUpperCase();

  return createPortal(
    <div className="cmod-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cmod-panel">
        {/* Header */}
        <div className="cmod-header">
          <span className="cmod-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div>
            <h2 className="cmod-title">Mark as Completed</h2>
            <p className="cmod-sub">{training.name}</p>
          </div>
          <button className="cmod-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="cmod-body">
          <p className="cmod-desc">
            Training documentation (Word or PDF) is optional.<br />
            It will be sent by email to the owner(s):
            <strong> {ownerEmails.join(', ') || '—'}</strong>
          </p>

          <div className="cmod-field-wrap">
            <label htmlFor="completion-link" className="cmod-label">Training Link </label>
            <input
              id="completion-link"
              className="cmod-input"
              type="url"
              placeholder="https://..."
              value={link}
              onChange={e => setLink(e.target.value)}
            />
          </div>

          <div className="cmod-field-wrap">
            <label htmlFor="completion-summary" className="cmod-label">Description </label>
            <textarea
              id="completion-summary"
              className="cmod-textarea"
              placeholder="Trainer summary/details when training is completed..."
              value={summary}
              onChange={e => setSummary(e.target.value)}
              rows={4}
            />
          </div>

          {/* Drop zone */}
          <div
            className={`cmod-dropzone ${file ? 'cmod-dropzone-has' : ''}`}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
            {file ? (
              <div className="cmod-file-info">
                <span className={`cmod-file-badge ${ext === 'PDF' ? 'cmod-badge-pdf' : 'cmod-badge-word'}`}>
                  {ext}
                </span>
                <div>
                  <p className="cmod-file-name">{file.name}</p>
                  <p className="cmod-file-size">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  className="cmod-file-rm"
                  onClick={e => { e.stopPropagation(); setFile(null); inputRef.current.value = ''; }}
                  title="Remove"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="cmod-dz-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                  stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <p>Click to select a file</p>
                <span>.PDF, .DOC, .DOCX</span>
              </div>
            )}
          </div>

          {error && <p className="cmod-error">{error}</p>}
        </div>

        {/* Footer */}
        <div className="cmod-footer">
          <button className="cmod-btn-cancel" onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button className="cmod-btn-send" onClick={handleSend} disabled={sending}>
            {sending ? (
              <>
                <span className="cmod-spinner" />
                Sending…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Send to Owner
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

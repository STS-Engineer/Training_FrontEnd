import React, { useState, useEffect } from 'react';
import { fileKind } from './fileHelpers';

function FileThumb({ file, onClick }) {
  const kind = fileKind(file);
  return (
    <button className={`fthumb fthumb-${kind}`} onClick={onClick} title={file.name}>
      {kind === 'image' && (
        <img src={file.url} alt={file.name} className="fthumb-img-preview" />
      )}
      {kind === 'video' && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      )}
      {kind === 'document' && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
        </svg>
      )}
    </button>
  );
}

export function FilesCell({ files, onOpen }) {
  if (!files.length) return <span className="tbl-null">—</span>;
  const visible = files.slice(0, 4);
  const extra   = files.length - visible.length;
  return (
    <div className="fthumb-grid">
      {visible.map((f, i) => (
        <FileThumb key={i} file={f} onClick={() => onOpen(files, i)} />
      ))}
      {extra > 0 && (
        <button className="fthumb-more" onClick={() => onOpen(files, visible.length)}>
          +{extra}
        </button>
      )}
    </div>
  );
}

export default function MediaModal({ modal, onClose }) {
  const { files, index } = modal;
  const [cur, setCur] = useState(index);
  const file = files[cur];
  const kind = fileKind(file);

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div className="mdl-overlay" onClick={onClose}>
      <div className="mdl-box" onClick={e => e.stopPropagation()}>

        <div className="mdl-head">
          <span className="mdl-filename">{file.name}</span>
          <button className="mdl-close" onClick={onClose} title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mdl-body">
          {kind === 'image' && (
            <img src={file.url} alt={file.name} className="mdl-media" />
          )}
          {kind === 'video' && (
            <video src={file.url} controls autoPlay className="mdl-media" />
          )}
          {kind === 'document' && (
            <div className="mdl-doc-view">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2563eb"
                strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <p className="mdl-doc-name">{file.name}</p>
              <a href={file.url} download={file.name} className="mdl-download"
                target="_blank" rel="noreferrer">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download File
              </a>
            </div>
          )}
        </div>

        {files.length > 1 && (
          <div className="mdl-nav">
            <button className="mdl-nav-btn"
              onClick={() => setCur(c => Math.max(0, c - 1))}
              disabled={cur === 0}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="mdl-nav-count">{cur + 1} / {files.length}</span>
            <button className="mdl-nav-btn"
              onClick={() => setCur(c => Math.min(files.length - 1, c + 1))}
              disabled={cur === files.length - 1}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

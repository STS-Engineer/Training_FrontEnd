import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { renderAsync } from 'docx-preview';

const ZOOM_STEPS = [50, 75, 100, 125, 150, 200];

export default function WordViewerModal({ source, name, onClose }) {
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [zoom,        setZoom]        = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [renderKey,   setRenderKey]   = useState(0);
  const containerRef = useRef(null);
  const bodyRef      = useRef(null);

  useEffect(() => {
    let objectUrl = null;
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    if (containerRef.current) containerRef.current.innerHTML = '';

    async function render() {
      try {
        let arrayBuffer;
        if (source instanceof File) {
          arrayBuffer = await source.arrayBuffer();
          objectUrl   = URL.createObjectURL(source);
          setDownloadUrl(objectUrl);
        } else {
          const res = await fetch(source);
          if (!res.ok) throw new Error(`Cannot load file (${res.status})`);
          arrayBuffer = await res.arrayBuffer();
          setDownloadUrl(source);
        }
        await renderAsync(arrayBuffer, containerRef.current, null, {
          className:       'docx',
          inWrapper:       true,
          ignoreWidth:     false,
          ignoreHeight:    false,
          breakPages:      true,
          renderHeaders:   true,
          renderFooters:   true,
          renderFootnotes: true,
          renderEndnotes:  true,
        });
        const pages = containerRef.current?.querySelectorAll('section.docx');
        setTotalPages(Math.max(1, pages?.length ?? 1));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    render();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [source, name, renderKey]);

  // Track current page on body scroll
  useEffect(() => {
    if (loading) return;
    const body = bodyRef.current;
    if (!body) return;
    const onScroll = () => {
      const pages = containerRef.current?.querySelectorAll('section.docx');
      if (!pages?.length) return;
      const mid = body.getBoundingClientRect().top + body.clientHeight / 2;
      let cur = 1;
      pages.forEach((p, i) => {
        if (p.getBoundingClientRect().top <= mid) cur = i + 1;
      });
      setCurrentPage(cur);
    };
    body.addEventListener('scroll', onScroll, { passive: true });
    return () => body.removeEventListener('scroll', onScroll);
  }, [loading]);

  const goToPage = (page) => {
    const p = Math.max(1, Math.min(page, totalPages));
    containerRef.current
      ?.querySelectorAll('section.docx')
      ?.[p - 1]
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setCurrentPage(p);
  };

  const zoomIn  = () => { const n = ZOOM_STEPS.find(z => z > zoom);                if (n) setZoom(n); };
  const zoomOut = () => { const n = [...ZOOM_STEPS].reverse().find(z => z < zoom); if (n) setZoom(n); };

  const handlePrint = () => {
    const pw = window.open('', '_blank', 'width=950,height=700');
    if (!pw) return;
    const styles = Array.from(document.styleSheets)
      .flatMap(s => { try { return Array.from(s.cssRules).map(r => r.cssText); } catch { return []; } })
      .join('\n');
    pw.document.write(
      `<!DOCTYPE html><html><head><style>${styles}\nbody{margin:0;background:#e8e8e8}</style></head>` +
      `<body>${containerRef.current?.innerHTML ?? ''}</body></html>`
    );
    pw.document.close();
    pw.focus();
    setTimeout(() => pw.print(), 600);
  };

  const modal = (
    <div className="wv-overlay" onClick={onClose}>
      <div className="wv-modal" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="wv-header">
          <div className="wv-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span title={name}>{name}</span>
          </div>
          <button type="button" className="wv-close" onClick={onClose} title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="wv-body" ref={bodyRef}>
          {loading && (
            <div className="wv-loading">
              <div className="wv-spinner" />
              Loading document…
            </div>
          )}
          {!loading && error && <div className="wv-error">⚠ {error}</div>}
          <div
            ref={containerRef}
            className="wv-docx-container"
            style={{ display: loading || error ? 'none' : 'block', zoom: `${zoom}%` }}
          />
        </div>

        {/* ── Bottom toolbar (visible only after render) ── */}
        {!loading && !error && (
          <div className="wv-toolbar">

            {/* Zoom */}
            <div className="wv-tb-group">
              <button className="wv-tb-btn" onClick={zoomOut}
                disabled={zoom <= ZOOM_STEPS[0]} title="Zoom out">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <span className="wv-tb-label">{zoom}%</span>
              <button className="wv-tb-btn" onClick={zoomIn}
                disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]} title="Zoom in">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>

            <div className="wv-tb-sep" />

            {/* Page navigation */}
            <div className="wv-tb-group">
              <button className="wv-tb-btn" onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1} title="Previous page">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <span className="wv-tb-label">{currentPage} / {totalPages}</span>
              <button className="wv-tb-btn" onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages} title="Next page">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>

            <div className="wv-tb-sep" />

            {/* Actions */}
            <div className="wv-tb-group">
              {/* Refresh */}
              <button className="wv-tb-btn" onClick={() => setRenderKey(k => k + 1)} title="Reload">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                </svg>
              </button>
              {/* Download */}
              {downloadUrl && (
                <a href={downloadUrl} download={name} className="wv-tb-btn" title="Download">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </a>
              )}
              {/* Print */}
              <button className="wv-tb-btn" onClick={handlePrint} title="Print">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
              </button>
              {/* Close / X */}
              <button className="wv-tb-btn wv-tb-btn-danger" onClick={onClose} title="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

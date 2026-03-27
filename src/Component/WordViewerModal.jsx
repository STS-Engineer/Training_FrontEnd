import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { renderAsync } from 'docx-preview';

const ZOOM_STEPS = [50, 75, 100, 125, 150, 200];

function getExtension(name = '') {
  return String(name).split('?')[0].split('.').pop()?.toLowerCase() ?? '';
}

function isWordPreviewable(name = '', mime = '') {
  const extension = getExtension(name);
  const normalizedMime = String(mime).toLowerCase();
  return extension === 'docx'
    || normalizedMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}

export default function WordViewerModal({ source, name, mime, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [renderKey, setRenderKey] = useState(0);
  const [isWordFile, setIsWordFile] = useState(false);
  const containerRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setTotalPages(1);
    if (containerRef.current) containerRef.current.innerHTML = '';

    async function setupPreview() {
      try {
        let resolvedSource = source;
        if (source instanceof File) {
          resolvedSource = URL.createObjectURL(source);
          objectUrl = resolvedSource;
        }

        const previewableWordFile = isWordPreviewable(name, mime);
        setIsWordFile(previewableWordFile);
        setDownloadUrl(resolvedSource);

        if (!previewableWordFile) {
          setLoading(false);
          return;
        }

        const arrayBuffer = source instanceof File
          ? await source.arrayBuffer()
          : await fetch(source).then(async response => {
              if (!response.ok) throw new Error(`Cannot load file (${response.status})`);
              return response.arrayBuffer();
            });

        if (cancelled) return;
        if (!containerRef.current) throw new Error('Preview container not available.');

        await renderAsync(arrayBuffer, containerRef.current, null, {
          className: 'docx',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });

        if (cancelled) return;
        const pages = containerRef.current.querySelectorAll('section.docx');
        setTotalPages(Math.max(1, pages.length));
      } catch (previewError) {
        if (!cancelled) setError(previewError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    setupPreview();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mime, name, renderKey, source]);

  useEffect(() => {
    if (loading || !isWordFile) return undefined;

    const body = bodyRef.current;
    if (!body) return undefined;

    const onScroll = () => {
      const pages = containerRef.current?.querySelectorAll('section.docx');
      if (!pages?.length) return;
      const midpoint = body.getBoundingClientRect().top + body.clientHeight / 2;
      let activePage = 1;

      pages.forEach((page, index) => {
        if (page.getBoundingClientRect().top <= midpoint) activePage = index + 1;
      });

      setCurrentPage(activePage);
    };

    body.addEventListener('scroll', onScroll, { passive: true });
    return () => body.removeEventListener('scroll', onScroll);
  }, [isWordFile, loading]);

  const goToPage = page => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    containerRef.current
      ?.querySelectorAll('section.docx')
      ?.[targetPage - 1]
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setCurrentPage(targetPage);
  };

  const zoomIn = () => {
    const nextZoom = ZOOM_STEPS.find(step => step > zoom);
    if (nextZoom) setZoom(nextZoom);
  };

  const zoomOut = () => {
    const nextZoom = [...ZOOM_STEPS].reverse().find(step => step < zoom);
    if (nextZoom) setZoom(nextZoom);
  };

  const handlePrint = () => {
    if (!isWordFile) return;

    const printWindow = window.open('', '_blank', 'width=950,height=700');
    if (!printWindow) return;

    const styles = Array.from(document.styleSheets)
      .flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText);
        } catch {
          return [];
        }
      })
      .join('\n');

    printWindow.document.write(
      `<!DOCTYPE html><html><head><style>${styles}\nbody{margin:0;background:#e8e8e8}</style></head>` +
      `<body>${containerRef.current?.innerHTML ?? ''}</body></html>`
    );
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 600);
  };

  const modal = (
    <div className="wv-overlay" onClick={onClose}>
      <div className="wv-modal" onClick={event => event.stopPropagation()}>
        <div className="wv-header">
          <div className="wv-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span title={name}>{name}</span>
          </div>
          <button type="button" className="wv-close" onClick={onClose} title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="wv-body" ref={bodyRef}>
          {loading && (
            <div className="wv-loading">
              <div className="wv-spinner" />
              Loading document...
            </div>
          )}

          {!loading && error && (
            <div className="wv-error">Error: {error}</div>
          )}

          <div
            ref={containerRef}
            className="wv-docx-container"
            style={{
              display: !loading && !error && isWordFile ? 'block' : 'none',
              zoom: `${zoom}%`,
            }}
          />

          {!loading && !error && !isWordFile && (
            <div className="wv-fallback">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2563eb"
                strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <p className="wv-fallback-title">{name}</p>
              <p className="wv-fallback-text">Preview is available only for Word files.</p>
              {downloadUrl && (
                <a href={downloadUrl} download={name} className="wv-action-btn wv-action-btn-primary">
                  Download
                </a>
              )}
            </div>
          )}
        </div>

        {!loading && !error && (
          <div className="wv-toolbar">
            {isWordFile && (
              <>
                <div className="wv-tb-group">
                  <button className="wv-tb-btn" onClick={zoomOut} disabled={zoom <= ZOOM_STEPS[0]} title="Zoom out">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.5" strokeLinecap="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <span className="wv-tb-label">{zoom}%</span>
                  <button className="wv-tb-btn" onClick={zoomIn} disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]} title="Zoom in">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>

                <div className="wv-tb-sep" />

                <div className="wv-tb-group">
                  <button className="wv-tb-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} title="Previous page">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <span className="wv-tb-label">{currentPage} / {totalPages}</span>
                  <button className="wv-tb-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages} title="Next page">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>

                <div className="wv-tb-sep" />
              </>
            )}

            <div className="wv-tb-group">
              {isWordFile && (
                <button className="wv-tb-btn" onClick={() => setRenderKey(key => key + 1)} title="Reload">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                  </svg>
                </button>
              )}

              {downloadUrl && isWordFile && (
                <a href={downloadUrl} download={name} className="wv-tb-btn" title="Download">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </a>
              )}

              {isWordFile && (
                <button className="wv-tb-btn" onClick={handlePrint} title="Print">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                </button>
              )}

              <button className="wv-tb-btn wv-tb-btn-danger" onClick={onClose} title="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
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

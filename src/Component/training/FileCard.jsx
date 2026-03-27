import { useState, useEffect } from 'react';
import FilePreviewIcon from './FilePreviewIcon';

function getFileCategory(file) {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'document';
}

export default function FileCard({ file, index, onRemove, onFileClick }) {
  const category = getFileCategory(file);
  const [preview, setPreview] = useState(null);
  const isPreviewableDocument = category === 'document' && !!onFileClick;

  useEffect(() => {
    if (category !== 'image') return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, category]);

  const sizeLabel = file.size < 1024 * 1024
    ? `${(file.size / 1024).toFixed(1)} KB`
    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <li
      className={`file-card file-card-${category}${isPreviewableDocument ? ' file-card-clickable' : ''}`}
      onClick={isPreviewableDocument ? () => onFileClick(file, file.name, file.type) : undefined}
    >
      {category === 'image' && preview ? (
        <div className="file-thumb">
          <img src={preview} alt={file.name} />
        </div>
      ) : (
        <div className="file-icon">
          <FilePreviewIcon category={category} />
        </div>
      )}
      <div className="file-info">
        <span className="file-card-name">{file.name}</span>
        <span className="file-card-meta">{isPreviewableDocument ? 'Click to preview' : sizeLabel}</span>
      </div>
      <button
        type="button"
        className="file-remove"
        onClick={(e) => { e.stopPropagation(); onRemove(index); }}
        aria-label={`Remove ${file.name}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </li>
  );
}

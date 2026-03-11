import { useState, useRef } from 'react';
import UploadIcon from './UploadIcon';
import FileCard, { isWordDoc } from './FileCard';
import FilePreviewIcon from './FilePreviewIcon';

const FILES_HOST = 'http://localhost:3000';

function normalizeServerFile(f) {
  const filePath = f.file_path ?? f.url ?? f.path ?? '';
  const name     = f.file_name ?? f.filename ?? f.name ?? filePath.split('/').pop() ?? 'file';
  const mimeType = f.mime_type ?? f.mimeType ?? f.type ?? '';
  const url      = filePath.startsWith('http') ? filePath
    : `${FILES_HOST}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  return { url, name, mimeType };
}

function ServerFileCard({ file, index, onRemove, onFileClick }) {
  const { url, name, mimeType } = normalizeServerFile(file);
  const isImage = mimeType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(name);
  const isVideo = mimeType.startsWith('video/') || /\.(mp4|mov|avi|webm)$/i.test(name);
  const isWord  = isWordDoc(name);
  const category = isImage ? 'image' : isVideo ? 'video' : 'document';

  return (
    <li
      className={`file-card file-card-${category}${isWord && onFileClick ? ' file-card-clickable' : ''}`}
      onClick={isWord && onFileClick ? () => onFileClick(url, name) : undefined}
    >
      {isImage ? (
        <div className="file-thumb">
          <img src={url} alt={name} />
        </div>
      ) : (
        <div className="file-icon">
          <FilePreviewIcon category={category} />
        </div>
      )}
      <div className="file-info">
        <span className="file-card-name">{name}</span>
        {isWord && onFileClick ? (
          <span className="sf-view-link">Click to preview</span>
        ) : (
          <a href={url} target="_blank" rel="noreferrer" className="sf-view-link"
            onClick={e => e.stopPropagation()}>View</a>
        )}
      </div>
      {onRemove && (
        <button type="button" className="file-remove"
          onClick={(e) => { e.stopPropagation(); onRemove(index); }}
          aria-label={`Remove ${name}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </li>
  );
}

let _uploadIdCounter = 0;

export default function FileUploadArea({ label, description, files, setFiles, accept, serverFiles = [], onRemoveServerFile = null, onFileClick = null }) {
  const inputId = useRef(`upload-input-${++_uploadIdCounter}`).current;
  const areaRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (areaRef.current && !areaRef.current.contains(e.relatedTarget)) setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) setFiles(prev => [...prev, ...dropped]);
  };

  const handleChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 0) setFiles(prev => [...prev, ...selected]);
    e.target.value = '';
  };

  return (
    <div className="fg">
      <span className="upload-label">{label}</span>
      {description && <p className="fd">{description}</p>}
      <label
        htmlFor={inputId}
        ref={areaRef}
        className={`upload-area${isDragging ? ' dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label={`Upload files for ${label}`}
      >
        <input
          id={inputId}
          type="file"
          multiple
          accept={accept}
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        <UploadIcon />
        <p className="upload-text">Click or drag files to this area to upload</p>
      </label>
      {(serverFiles.length > 0 || files.length > 0) && (
        <ul className="file-list">
          {serverFiles.map((f, i) => (
            <ServerFileCard
              key={`sv-${i}`}
              file={f}
              index={i}
              onRemove={onRemoveServerFile}
              onFileClick={onFileClick}
            />
          ))}
          {files.map((file, i) => (
            <FileCard
              key={i}
              file={file}
              index={i}
              onRemove={(idx) => setFiles(prev => prev.filter((_, j) => j !== idx))}
              onFileClick={onFileClick}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
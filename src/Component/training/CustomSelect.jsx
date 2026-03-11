import { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ name, value, onChange, options, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedLabel = options.find(o => String(o.value) === String(value))?.label || '';

  const handleSelect = (optVal) => {
    onChange({ target: { name, value: optVal } });
    setOpen(false);
    setHovered(null);
  };

  return (
    <div className={`csel${open ? ' csel-open' : ''}${disabled ? ' csel-disabled' : ''}`} ref={ref}>
      <button
        type="button"
        className={`csel-trigger fi${!value ? ' placeholder' : ''}`}
        onClick={() => !disabled && setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span>{selectedLabel || placeholder}</span>
        <svg className={`csel-arrow${open ? ' csel-arrow-up' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <ul className="csel-list" role="listbox">
          {options.map(o => (
            <li
              key={o.value}
              role="option"
              aria-selected={String(o.value) === String(value)}
              className={`csel-option${String(o.value) === String(value) ? ' csel-selected' : ''}${hovered === o.value ? ' csel-hovered' : ''}`}
              onMouseEnter={() => setHovered(o.value)}
              onMouseLeave={() => setHovered(null)}
              onMouseDown={() => handleSelect(o.value)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
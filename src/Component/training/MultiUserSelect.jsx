import { useState, useRef, useEffect } from 'react';

export default function MultiUserSelect({ name, value, onChange, options, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (optVal) => {
    const strVal = String(optVal);
    const current = value.map(String);
    const next = current.includes(strVal)
      ? current.filter(v => v !== strVal)
      : [...current, strVal];
    onChange({ target: { name, value: next } });
  };

  const remove = (optVal) => {
    onChange({ target: { name, value: value.filter(v => String(v) !== String(optVal)) } });
  };

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOptions = options.filter(o => value.map(String).includes(String(o.value)));

  return (
    <div className={`msel${open ? ' msel-open' : ''}${disabled ? ' msel-disabled' : ''}`} ref={ref}>
      <div
        className={`msel-trigger fi${value.length === 0 ? ' placeholder' : ''}`}
        onClick={() => !disabled && setOpen(o => !o)}
        role="combobox"
        aria-expanded={open}
        aria-controls="msel-listbox"
        aria-haspopup="listbox"
      >
        {value.length === 0 ? (
          <span className="msel-placeholder">{placeholder}</span>
        ) : (
          <div className="msel-tags">
            {selectedOptions.map(o => (
              <span key={o.value} className="msel-tag">
                {o.label}
                <button
                  type="button"
                  className="msel-tag-remove"
                  onClick={(e) => { e.stopPropagation(); remove(o.value); }}
                  aria-label={`Remove ${o.label}`}
                >×</button>
              </span>
            ))}
          </div>
        )}
        <svg className={`csel-arrow${open ? ' csel-arrow-up' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {open && (
        <div className="msel-dropdown">
          <div className="msel-search-wrap">
            <input
              className="msel-search"
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          </div>
          <ul className="csel-list msel-list" role="listbox" aria-multiselectable="true">
            {filtered.map(o => {
              const selected = value.map(String).includes(String(o.value));
              return (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={selected}
                  className={`csel-option${selected ? ' csel-selected' : ''}`}
                  onMouseDown={(e) => { e.preventDefault(); toggle(o.value); }}
                >
                  <span className="msel-check">{selected ? '✓' : ''}</span>
                  {o.label}
                </li>
              );
            })}
            {filtered.length === 0 && <li className="csel-option msel-no-results">No results</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
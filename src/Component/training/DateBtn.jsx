import { forwardRef } from 'react';

const DateBtn = forwardRef(({ value, onClick, placeholder }, ref) => (
  <button
    type="button"
    className={`date-btn fi${!value ? ' date-btn-placeholder' : ''}`}
    onClick={onClick}
    ref={ref}
  >
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
    <span>{value || placeholder}</span>
  </button>
));

export default DateBtn;
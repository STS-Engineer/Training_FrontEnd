import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    key: 'calendar',
    label: 'Calendar',
    path: '/calendar',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="db-sidebar">
      <nav className="db-sidebar-nav">
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.key}
              className={`db-sidebar-item${isActive ? ' db-sidebar-item-active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom section for settings */}
      <div className="db-sidebar-bottom">
        <button
          className={`db-sidebar-item${location.pathname === '/change-password' ? ' db-sidebar-item-active' : ''}`}
          onClick={() => navigate('/change-password')}
          title="Change Password"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <path d="M12 1v6m0 6v6" />
            <circle cx="4.22" cy="4.22" r="1" />
            <path d="M15.64 8.64l4.24-4.24M19.78 19.78l-4.24-4.24" />
            <circle cx="1" cy="12" r="1" />
            <path d="M7 12h6m6 0h.01" />
            <circle cx="4.22" cy="19.78" r="1" />
            <path d="M8.64 15.64l-4.24 4.24M23 12c0 6.075-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1" />
          </svg>
          <span>Change Password</span>
        </button>
      </div>
    </aside>
  );
}

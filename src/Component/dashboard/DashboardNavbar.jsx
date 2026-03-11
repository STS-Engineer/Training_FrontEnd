import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardNavbar({ member, onSignOut }) {
  const navigate = useNavigate();

  return (
    <header className="db-nav">
      <div className="db-nav-left">
        <img src="/img/logo.PNG" alt="AVOCarbon" className="db-nav-logo" />
        <span className="db-nav-title">Training Dashboard</span>
      </div>
      <div className="db-nav-right">
        <div className="db-user-chip">
          <div className="db-user-avatar">
            {(member.first_name?.[0] ?? member.display_name?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="db-user-info">
            <span className="db-user-name">
              {member.display_name ?? `${member.first_name} ${member.last_name}`}
            </span>
            <span className="db-user-role">{member.job_title}</span>
          </div>
        </div>

        <button className="db-btn-new" onClick={() => navigate('/training')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Request
        </button>

        <button className="db-btn-signout" onClick={onSignOut} title="Sign out">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </header>
  );
}

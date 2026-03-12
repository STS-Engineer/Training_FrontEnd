import React from 'react';
import NotificationBell from './NotificationBell';

export default function DashboardNavbar({ member, onSignOut }) {
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

        <NotificationBell userId={member?.id} />

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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTrainings } from '../api';
import { getSession, clearSession } from '../session';
import DashboardNavbar from './dashboard/DashboardNavbar';
import Sidebar from './dashboard/Sidebar';
import './../Style/Dashboard.css';

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const { member } = getSession();
  const currentUserRole = String(member?.role ?? '').toLowerCase();
  const isAdmin = currentUserRole === 'admin';
  const currentRequesterId = String(member?.id ?? member?.member_id ?? '');

  const today  = new Date();
  const [year,  setYear]      = useState(today.getFullYear());
  const [month, setMonth]     = useState(today.getMonth());
  const [trainings, setTrainings] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null); 

  useEffect(() => {
    fetchTrainings()
      .then(data => {
        const visibleTrainings = (isAdmin
          ? data
          : data.filter(training =>
              (training.requesters ?? []).some(requester =>
                String(requester?.id ?? requester?.member_id ?? requester) === currentRequesterId
              )
            )
        ).filter(t => t.status === 'in progress');
        setTrainings(visibleTrainings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdmin, currentRequesterId]);

  const handleSignOut = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelected(null);
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(null); };

  const eventMap = {};
  trainings.forEach(t => {
    if (!t.publication_date) return;
    const d = new Date(t.publication_date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventMap[day]) eventMap[day] = [];
      eventMap[day].push(t);
    }
  });

  const daysInMonth   = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);
  const totalCells    = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="db-page">
      <DashboardNavbar member={member} onSignOut={handleSignOut} />
      <div className="db-body">
        <Sidebar />
        <main className="db-main">
          {/* Header */}
          <div className="cal-header">
            <div className="cal-header-left">
              <h1 className="cal-title">
                {MONTHS[month]} <span>{year}</span>
              </h1>
              <p className="cal-sub">In-progress trainings by publication date</p>
            </div>
            <div className="cal-header-actions">
              <button className="cal-btn-today" onClick={goToday}>Today</button>
              <div className="cal-nav">
                <button className="cal-nav-btn" onClick={prevMonth} title="Previous month">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button className="cal-nav-btn" onClick={nextMonth} title="Next month">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="db-loading"><span className="db-spinner" /><p>Loading…</p></div>
          ) : (
            <div className="cal-wrap">
              {/* Day-of-week header */}
              <div className="cal-grid cal-grid-hd">
                {DAYS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
              </div>

              {/* Calendar cells */}
              <div className="cal-grid">
                {Array.from({ length: totalCells }, (_, i) => {
                  const dayNum = i - firstDayOfWeek + 1;
                  const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
                  const events  = inMonth ? (eventMap[dayNum] ?? []) : [];
                  const active  = selected?.day === dayNum && inMonth;

                  return (
                    <div
                      key={i}
                      className={[
                        'cal-cell',
                        !inMonth       ? 'cal-cell-out'    : '',
                        isToday(dayNum) ? 'cal-cell-today'  : '',
                        active          ? 'cal-cell-active'  : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => inMonth && events.length > 0 && setSelected(active ? null : { day: dayNum, items: events })}
                    >
                      <span className="cal-day-num">{inMonth ? dayNum : ''}</span>
                      <div className="cal-events">
                        {events.slice(0, 2).map(t => (
                          <div key={t.id} className="cal-event" title={t.name}>
                            {t.name}
                          </div>
                        ))}
                        {events.length > 2 && (
                          <div className="cal-event-more">+{events.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detail panel for selected day */}
              {selected && (
                <div className="cal-detail">
                  <div className="cal-detail-hd">
                    <span className="cal-detail-date">
                      {MONTHS[month]} {selected.day}, {year}
                    </span>
                    <button className="cal-detail-close" onClick={() => setSelected(null)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="cal-detail-list">
                    {selected.items.map(t => (
                      <div key={t.id} className="cal-detail-item">
                        <div className="cal-detail-dot" />
                        <div>
                          <p className="cal-detail-name">{t.name}</p>
                          {t.department && (
                            <p className="cal-detail-meta">{t.department}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

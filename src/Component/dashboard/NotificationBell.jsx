import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  deleteNotification,
} from '../../api';

const POLL_INTERVAL = 30000; // 30 seconds

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function NotificationBell({ userId }) {
  const [open, setOpen]           = useState(false);
  const [notifications, setNots]  = useState([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(false);
  const panelRef = useRef(null);

  const loadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const count = await fetchUnreadCount(userId);
      setUnread(count);
    } catch (_) {}
  }, [userId]);

  const loadAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await fetchNotifications(userId);
      setNots(Array.isArray(data) ? data : []);
      setUnread((Array.isArray(data) ? data : []).filter(n => !n.is_read).length);
    } catch (_) {}
    setLoading(false);
  }, [userId]);

  // Poll unread count every 30s
  useEffect(() => {
    loadCount();
    const id = setInterval(loadCount, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [loadCount]);

  // Load full list when panel opens, then auto-mark all as read
  useEffect(() => {
    if (!open) return;
    loadAll().then(async () => {
      await markAllNotificationsRead(userId).catch(() => {});
      setNots(prev => prev.map(x => ({ ...x, is_read: true })));
      setUnread(0);
    });
  }, [open, loadAll, userId]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkRead = async (n) => {
    // already marked read on panel open, no-op
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteNotification(id).catch(() => {});
    setNots(prev => {
      const removed = prev.find(x => x.id === id);
      if (removed && !removed.is_read) setUnread(c => Math.max(0, c - 1));
      return prev.filter(x => x.id !== id);
    });
  };

  return (
    <div className="notif-wrap" ref={panelRef}>
      <button
        className="notif-bell-btn"
        onClick={() => setOpen(v => !v)}
        title="Notifications"
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-hd">
            <span className="notif-panel-title">Notifications</span>
          </div>

          <div className="notif-list">
            {loading ? (
              <div className="notif-empty">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                  stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item${n.is_read ? '' : ' notif-item-unread'}`}
                  onClick={() => handleMarkRead(n)}
                >
                  <div className="notif-item-body">
                    {!n.is_read && <span className="notif-dot" />}
                    <div className="notif-item-content">
                      <p className="notif-item-msg">{n.message}</p>
                      <span className="notif-item-time">{timeAgo(n.createdAt ?? n.created_at)}</span>
                    </div>
                  </div>
                  <button
                    className="notif-item-del"
                    onClick={(e) => handleDelete(e, n.id)}
                    title="Delete"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

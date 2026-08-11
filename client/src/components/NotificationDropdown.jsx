import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { connectSocket } from '../socket';

export default function NotificationDropdown({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const socket = connectSocket();
    if (socket) {
      const handleNewNotif = (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      };
      socket.on('new_notification', handleNewNotif);

      return () => {
        socket.off('new_notification', handleNewNotif);
      };
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await api.put(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
    onClose();
    if (notif.link) {
      navigate(notif.link);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="notification-dropdown"
      style={{
        position: 'absolute',
        top: 'calc(100% + 12px)',
        right: 0,
        width: '360px',
        maxHeight: '480px',
        background: 'rgba(15, 17, 26, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 20px rgba(124, 58, 237, 0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#fff', fontFamily: 'Syne, sans-serif' }}>
            Notifications
          </h4>
          {unreadCount > 0 && (
            <span
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              background: 'none',
              border: 'none',
              color: '#a78bfa',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
        {loading && notifications.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔔</div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => handleNotificationClick(notif)}
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                marginBottom: '6px',
                background: notif.read ? 'transparent' : 'rgba(124, 58, 237, 0.08)',
                border: notif.read ? '1px solid transparent' : '1px solid rgba(124, 58, 237, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = notif.read
                  ? 'transparent'
                  : 'rgba(124, 58, 237, 0.08)')
              }
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(168, 85, 247, 0.2))',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0,
                }}
              >
                {notif.type === 'JOIN_REQUEST'
                  ? '🙋'
                  : notif.type === 'INVITE'
                  ? '✉️'
                  : notif.type === 'REQUEST_ACCEPTED'
                  ? '🎉'
                  : notif.type === 'ENDORSEMENT'
                  ? '⭐'
                  : notif.type === 'DIRECT_MESSAGE'
                  ? '💬'
                  : '📌'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                  <h5
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      fontWeight: notif.read ? '600' : '700',
                      color: notif.read ? '#cbd5e1' : '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {notif.title}
                  </h5>
                  <span style={{ fontSize: '10px', color: '#64748b', flexShrink: 0 }}>
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '12px',
                    color: '#94a3b8',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {notif.message}
                </p>
              </div>

              {!notif.read && (
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#a855f7',
                    boxShadow: '0 0 8px #a855f7',
                    marginTop: '6px',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

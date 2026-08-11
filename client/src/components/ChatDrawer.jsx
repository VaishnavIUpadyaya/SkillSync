import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { connectSocket } from '../socket';
import { useAuth } from '../context/AuthContext';

export default function ChatDrawer({ isOpen, onClose, mode = 'project', projectId = null, recipient = null, projectTitle = '' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        if (mode === 'project' && projectId) {
          const res = await api.get(`/messages/project/${projectId}`);
          setMessages(res.data || []);
        } else if (mode === 'dm' && recipient?._id) {
          const res = await api.get(`/messages/dm/${recipient._id}`);
          setMessages(res.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch message history:', err);
      } finally {
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      }
    };

    fetchHistory();

    const socket = connectSocket();
    if (!socket) return;

    if (mode === 'project' && projectId) {
      socket.emit('join_project_room', projectId);

      const handleProjectMsg = (msg) => {
        // msg.project can be a MongoDB ObjectId — always compare as strings
        const msgProjectId = msg.project?._id?.toString() || msg.project?.toString();
        if (msgProjectId === projectId.toString()) {
          setMessages((prev) => [...prev, msg]);
          setTimeout(scrollToBottom, 50);
        }
      };

      socket.on('new_project_message', handleProjectMsg);

      return () => {
        socket.emit('leave_project_room', projectId);
        socket.off('new_project_message', handleProjectMsg);
      };
    } else if (mode === 'dm' && recipient?._id) {
      socket.emit('join_dm_room', { recipientId: recipient._id });

      const handleDmMsg = (msg) => {
        const myId = user?._id?.toString() || user?.id?.toString()
        const recipientId = recipient._id?.toString()
        const msgSenderId = msg.sender?._id?.toString() || msg.sender?.toString()
        const msgRecipientId = msg.recipient?._id?.toString() || msg.recipient?.toString()
        if (
          (msgSenderId === recipientId && msgRecipientId === myId) ||
          (msgSenderId === myId && msgRecipientId === recipientId)
        ) {
          setMessages((prev) => [...prev, msg]);
          setTimeout(scrollToBottom, 50);
        }
      };

      socket.on('new_dm_message', handleDmMsg);

      return () => {
        socket.emit('leave_dm_room', { recipientId: recipient._id });
        socket.off('new_dm_message', handleDmMsg);
      };
    }
  }, [isOpen, mode, projectId, recipient, user]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const socket = connectSocket();
    if (!socket) return;

    if (mode === 'project' && projectId) {
      socket.emit('send_project_message', { projectId, content: input.trim() });
    } else if (mode === 'dm' && recipient?._id) {
      socket.emit('send_dm_message', { recipientId: recipient._id, content: input.trim() });
    }

    setInput('');
  };

  if (!isOpen) return null;

  const headerTitle =
    mode === 'project' ? `Team Chat — ${projectTitle}` : `Direct Message — ${recipient?.name || 'User'}`;


  return (
    <>
      {/* Backdrop — click to close */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(2px)',
          zIndex: 1099,
        }}
      />
      <div
        className="chat-drawer-container"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'clamp(320px, 90vw, 440px)',
          background: 'rgba(11, 13, 20, 0.96)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.7)',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
      {/* Drawer Header */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
          >
            {mode === 'project' ? '👥' : '💬'}
          </div>
          <div>
            <h4
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: '700',
                color: '#fff',
                fontFamily: 'Syne, sans-serif',
              }}
            >
              {headerTitle}
            </h4>
            <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: '500' }}>● Live Socket Room</span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages Stream */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '20px' }}>
            Loading chat messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', marginTop: '40px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
            <p style={{ margin: 0, fontSize: '13px' }}>No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const myId = user?._id?.toString() || user?.id?.toString();
            const senderId = msg.sender?._id?.toString() || msg.sender?.id?.toString() || msg.sender?.toString();
            const isMe = !!(myId && senderId && myId === senderId);
            return (
              <div
                key={msg._id || index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                }}
              >
                {!isMe && (
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px', fontWeight: '600' }}>
                    {msg.sender?.name || 'Teammate'}
                  </span>
                )}
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '10px 14px',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isMe
                      ? 'linear-gradient(135deg, #7c3aed, #6366f1)'
                      : 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    wordBreak: 'break-word',
                    boxShadow: isMe ? '0 4px 14px rgba(124, 58, 237, 0.3)' : 'none',
                  }}
                >
                  {msg.content}
                </div>
                <span style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 17, 26, 0.95)',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#fff',
            fontSize: '13px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            border: 'none',
            borderRadius: '10px',
            padding: '0 16px',
            color: '#fff',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
          }}
        >
          Send
        </button>
      </form>
    </div>
    </>
  );
}

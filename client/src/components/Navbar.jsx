import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../api'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    if (!user) return
    const fetchCount = () => {
      api.get('/requests/notifications/count')
        .then(r => setNotifCount(r.data.total))
        .catch(() => {})
    }
    fetchCount()
    const interval = setInterval(() => {
  if (document.visibilityState === "visible") {
    fetchCount()
  }
}, 120000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (location.pathname === '/dashboard') {
      api.get('/requests/notifications/count')
        .then(r => setNotifCount(r.data.total))
        .catch(() => {})
    }
  }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/login') }

  const navLink = (to, label) => {
    const active = location.pathname === to
    return (
      <Link to={to} style={{
        color: active ? 'var(--accent2)' : 'var(--text2)',
        fontWeight: active ? '600' : '400',
        fontSize: '14px',
        textDecoration: 'none',
        padding: '6px 14px',
        borderRadius: '8px',
        background: active ? 'rgba(108,99,255,0.12)' : 'transparent',
        transition: 'all 0.2s',
      }}>{label}</Link>
    )
  }

  return (
    <nav style={{
      background: 'var(--navy2)',
      borderBottom: '1px solid var(--border)',
      padding: '0 32px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/dashboard" style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: '800',
        fontSize: '20px',
        color: 'var(--white)',
        textDecoration: 'none',
        letterSpacing: '-0.5px',
      }}>
        Skill<span style={{ color: 'var(--accent)' }}>Sync</span>
      </Link>

      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {navLink('/projects', 'Projects')}
          {navLink('/profile', 'Profile')}

          <Link to="/dashboard" style={{
            position: 'relative', display: 'flex', alignItems: 'center',
            justifyContent: 'center', width: '36px', height: '36px',
            borderRadius: '8px', color: 'var(--text2)', textDecoration: 'none',
            background: 'transparent', transition: 'background 0.2s', marginLeft: '4px'
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--navy3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {notifCount > 0 && (
              <span style={{
                position: 'absolute', top: '4px', right: '4px',
                background: 'var(--danger)', color: 'white',
                borderRadius: '50%', width: '16px', height: '16px',
                fontSize: '10px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Syne, sans-serif', lineHeight: 1,
              }}>
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </Link>

          <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 8px' }} />

          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'var(--accent2)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: '700', fontSize: '13px',
            color: 'white', marginRight: '8px', fontFamily: 'Syne, sans-serif',
            cursor: 'default'
          }}>{user.name?.[0]?.toUpperCase()}</div>

          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text2)', padding: '6px 14px', borderRadius: '8px',
            fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--danger)'; e.target.style.color = 'var(--danger)' }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text2)' }}
          >Logout</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          {navLink('/login', 'Login')}
          <Link to="/register" style={{
            background: 'var(--accent2)', color: 'white', padding: '7px 16px',
            borderRadius: '8px', fontSize: '14px', fontWeight: '500',
            textDecoration: 'none', transition: 'all 0.2s',
          }}>Get Started</Link>
        </div>
      )}
    </nav>
  )
}
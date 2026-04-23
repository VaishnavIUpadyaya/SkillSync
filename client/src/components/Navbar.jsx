import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
          {navLink('/dashboard', 'Dashboard')}
          {navLink('/projects', 'Projects')}
          {navLink('/profile', 'Profile')}
          <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 8px' }} />
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'var(--accent)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: '700', fontSize: '13px',
            color: 'white', marginRight: '8px', fontFamily: 'Syne, sans-serif'
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
            background: 'var(--accent)', color: 'white', padding: '7px 16px',
            borderRadius: '8px', fontSize: '14px', fontWeight: '500',
            textDecoration: 'none', transition: 'all 0.2s',
          }}>Get Started</Link>
        </div>
      )}
    </nav>
  )
}
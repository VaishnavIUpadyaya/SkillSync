import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../api'
import { useTheme } from '../context/ThemeContext'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import logo from '../assets/logo.png'
import NotificationDropdown from './NotificationDropdown'
import { connectSocket } from '../socket'


const MAIN_PAGES = ['/', '/home', '/Home', '/dashboard', '/projects', '/profile']


const NAV_ITEMS = [
  { to: '/home',         label: 'Home' },
  { to: '/dashboard',   label: 'Dashboard' },
  { to: '/projects',    label: 'Projects' },
  { to: '/users/search',label: 'People' },
]

function Logo({ theme }) {
  return (
    <Link to="/home" style={{ display: 'flex', alignItems: 'center' }}>
      <img
        src={logo}
        alt="Synera"
        className="nav-brand-logo"
        style={{
          width: '120px', height: 'auto',
          margin: '-50px 0 -60px -10px', objectFit: 'contain',
          filter: theme === 'light'
            ? 'brightness(0) drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            : 'drop-shadow(0 2px 8px rgba(99,179,237,0.25))',
          transition: 'filter 0.3s, transform 0.3s',
        }}
      />
    </Link>
  )
}


function Drawer({ open, onClose, user, logout, navigate, theme, toggleTheme, location }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <Motion.div
            key="backdrop"
            className="side-drawer-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <Motion.div
            key="drawer"
            className="side-drawer"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="side-drawer-header">
              <Logo theme={theme} />
              <button className="side-drawer-close" onClick={onClose} aria-label="Close menu">✕</button>
            </div>

            {NAV_ITEMS.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={location.pathname === item.to ? 'nav-link active' : 'nav-link'}
                onClick={onClose}
              >{item.label}</Link>
            ))}
            <Link
              to="/profile"
              className={location.pathname === '/profile' ? 'nav-link active' : 'nav-link'}
              onClick={onClose}
            >Profile</Link>

            <div className="side-drawer-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
              <button
                onClick={toggleTheme}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.06)', color: 'inherit',
                  fontSize: '13px', fontWeight: 600, width: '100%',
                }}
              >
                <span style={{ fontSize: '18px' }}>{theme === 'dark' ? '🌙' : '☀️'}</span>
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </button>

              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    className="avatar-pill"
                    style={{
                      backgroundImage: user.profilePic ? `url(${user.profilePic})` : 'none',
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      backgroundColor: user.profilePic ? 'transparent' : 'rgba(255,255,255,0.12)',
                      overflow: 'hidden',
                    }}
                  >
                    {!user.profilePic && user.name?.[0]?.toUpperCase()}
                  </div>
                  <button
                    onClick={() => { logout(); navigate('/login'); onClose() }}
                    className="logout-button"
                    style={{ flex: 1 }}
                  >Logout</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  <Link to="/login"    className="nav-link" onClick={onClose}>Login</Link>
                  <Link to="/register" className="nav-link" onClick={onClose}>Get Started</Link>
                </div>
              )}
            </div>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Minimal navbar for detail/secondary pages — just a floating hamburger
function MiniNavbar({ user, logout, navigate, theme, toggleTheme }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      <div style={{
        position: 'fixed',
top: '18px',
right: '24px',
width: 'auto',
margin: 0, zIndex: 100,
        display: 'flex', justifyContent: 'flex-end',
        pointerEvents: 'none',
      }}>
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="Open navigation menu"
          style={{
            pointerEvents: 'all',
            width: '42px', height: '42px', borderRadius: '12px',
            background: theme === 'light' ? 'rgba(255,255,255,0.88)' : 'rgba(30,40,62,0.88)',
            backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            border: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}`,
            color: theme === 'light' ? '#222' : 'rgba(220,210,255,0.9)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(0,0,0,0.22)',
            transition: 'background 0.2s',
          }}
        >
          {/* Hamburger icon */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="4"  width="16" height="2" rx="1" fill="currentColor" />
            <rect x="2" y="9"  width="16" height="2" rx="1" fill="currentColor" />
            <rect x="2" y="14" width="16" height="2" rx="1" fill="currentColor" />
          </svg>
        </button>
      </div>

      <Drawer
        open={open} onClose={() => setOpen(false)}
        user={user} logout={logout} navigate={navigate}
        theme={theme} toggleTheme={toggleTheme} location={location}
      />
    </>
  )
}

// Full navbar for main pages
export default function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [notifCount, setNotifCount] = useState(0)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAuthPage = ['/login', '/register'].includes(location.pathname)
  const isMainPage = MAIN_PAGES.includes(location.pathname)

  useEffect(() => {
    if (!user) return
    let isMounted = true

    const fetchUnreadNotifs = async () => {
      try {
        const res = await api.get('/notifications')
        if (isMounted) setNotifCount(res.data.unreadCount || 0)
      } catch {
        // fallback
      }
    }
    fetchUnreadNotifs()

    const socket = connectSocket()
    if (socket) {
      const handleNewNotif = () => setNotifCount(prev => prev + 1)
      socket.on('new_notification', handleNewNotif)
      return () => {
        isMounted = false
        socket.off('new_notification', handleNewNotif)
      }
    }
    return () => { isMounted = false }
  }, [user])

  const handleLogout = () => { logout(); navigate('/login') }

  const handleBellClick = (e) => {
    e.preventDefault()
    setIsNotifOpen(prev => !prev)
  }

  if (isAuthPage) return null

  const avatarStyle = {
    backgroundImage: user?.profilePic ? `url(${user.profilePic})` : 'none',
    backgroundSize: 'cover', backgroundPosition: 'center',
    backgroundColor: user?.profilePic ? 'transparent' : 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  }

  return (
    <>
      <Motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={`reactbits-navbar main-navbar desktop-navbar-only ${theme === 'dark' ? 'navbar-dark-mode' : ''}`}
        style={{
          position: 'sticky', top: '18px',
          width: 'min(calc(100% - 32px), 1180px)',
          margin: '0 auto', padding: '12px 22px',
          background: theme === 'light' ? 'rgba(122,113,113,0.85)' : '#2a3041ff',
          backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          border: theme === 'light' ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.10)',
          boxShadow: theme === 'light' ? '0 12px 32px rgba(0,0,0,0.06)' : '0 26px 60px rgba(0,0,0,0.15)',
        }}
      >
        <div className="rb-brand"><Logo theme={theme} /></div>

        <nav className="rb-links" aria-label="Primary navigation">
          {user
            ? NAV_ITEMS.map(item => (
                <Link
                  key={item.to} to={item.to}
                  className={location.pathname === item.to ? 'nav-link active' : 'nav-link'}
                >{item.label}</Link>
              ))
            : <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link nav-link--primary">Get Started</Link>
              </>
          }
        </nav>

        <div className="rb-actions">
          <button onClick={toggleTheme} className="rb-shiny-button" title="Toggle theme">
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={handleBellClick}
              className={notifCount > 0 ? 'icon-notif bell-ringing rb-magnetic-button' : 'icon-notif rb-magnetic-button'}
              title="Notifications" type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {notifCount > 0 && (
                <span className="notification-badge">
                  <span className="rb-number-ticker">{notifCount > 99 ? '99+' : notifCount}</span>
                </span>
              )}
            </button>
            <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
          </div>

          {user && (
            <Link to="/profile" className="avatar-pill avatar-glow desktop-only-user" title="Profile" style={avatarStyle}>
              {!user.profilePic && user.name?.[0]?.toUpperCase()}
            </Link>
          )}
          {user && <button onClick={handleLogout} className="rb-shiny-button desktop-logout-btn">Logout</button>}

          <button
            onClick={() => setMobileOpen(v => !v)}
            className="mobile-menu-btn"
            aria-label="Open menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </Motion.header>

      {/* ── Mobile Floating Hamburger Button (visible on mobile view across all pages) ── */}
      <div className="mobile-floating-trigger">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation sidebar menu"
          className="mobile-floating-btn"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="4"  width="16" height="2" rx="1" fill="currentColor" />
            <rect x="2" y="9"  width="16" height="2" rx="1" fill="currentColor" />
            <rect x="2" y="14" width="16" height="2" rx="1" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Slide-over Side Drawer Sidebar Menu on mobile view for all pages */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        logout={handleLogout}
        navigate={navigate}
        theme={theme}
        toggleTheme={toggleTheme}
        location={location}
      />
    </>
  )
}
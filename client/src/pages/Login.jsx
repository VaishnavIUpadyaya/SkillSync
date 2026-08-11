import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import GoogleSignInButton from '../components/GoogleSignInButton'
import logo from '../assets/logo.png'


export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', form)
      await login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <>
      <style>{`
        .auth-input::-ms-reveal,
        .auth-input::-ms-clear {
          display: none;
        }

        .auth-input:-webkit-autofill,
        .auth-input:-webkit-autofill:hover,
        .auth-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px var(--card) inset !important;
          -webkit-text-fill-color: var(--text) !important;
          border-color: var(--glass-border-hover) !important;
          transition: background-color 9999s ease;
        }

        .auth-input {
          width: 100%;
          padding: 0 44px;
          height: 50px;
          background: var(--card);
          border: 1.5px solid var(--glass-border);
          border-radius: 14px;
          color: var(--text);
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          caret-color: var(--accent3);
        }
        .auth-input::placeholder {
          color: var(--text);
        }
        .auth-input:focus {
          border-color: var(--accent3);
          box-shadow: 0 0 0 4px rgba(var(--accent3-rgb), 0.15);
        }

        .auth-field {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .auth-field-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: var(--text3);
        }
        .auth-field-icon {
          position: absolute;
          left: 15px;
          bottom: 17px;
          color: var(--accent3);
          pointer-events: none;
          transition: color 0.2s;
        }
        .auth-field:focus-within .auth-field-icon {
          color: var(--accent3);
        }
        .auth-field-icon-right {
          position: absolute;
          right: 14px;
          bottom: 14px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text3);
          padding: 4px;
          transition: color 0.2s;
          display: flex;
          align-items: center;
        }
        .auth-field-icon-right:hover { color: var(--accent); }

        .auth-btn {
          width: 100%;
          height: 52px;
          background: linear-gradient(90deg,rgba(20, 6, 15, 1) 0%, rgba(98, 36, 105, 1) 50%, rgba(108, 13, 120, 1) 100%);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Cabinet Grotesk', sans-serif;
          cursor: pointer;
          letter-spacing: 0.4px;
          box-shadow: 0 4px 24px rgba(var(--indigo-rgb), 0.3);
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }
        .auth-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(200,60,240,0.45);
        }
        .auth-btn:active:not(:disabled) { transform: scale(0.98); }
        .auth-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }
        .auth-btn .shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
          background-size: 200% 100%;
          background-position: -200% center;
          transition: background-position 0.6s;
        }
        .auth-btn:hover:not(:disabled) .shimmer {
          background-position: 200% center;
        }

        @keyframes auth-rise {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes auth-spin { to { transform: rotate(360deg); } }

        .auth-page-enter { animation: auth-rise 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .auth-card-enter { animation: auth-rise 0.6s 0.08s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        background: 'linear-gradient(90deg,rgba(12, 6, 20, 1) 0%, rgba(77, 64, 112, 1) 50%, rgba(237, 83, 232, 1) 100%)'
      }} />

      <div className="auth-page-enter" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 24px 40px',
        boxSizing: 'border-box'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <img 
              src={logo} 
              alt="SkillSync" 
              style={{ 
                width: '340px', 
                height: 'auto', 
                margin: '-200px auto -110px auto', 
                filter: 'drop-shadow(0 4px 16px rgba(99,179,237,0.35))' 
              }} 
            />
            <h1 style={{
              margin: '0 0 6px',
              fontSize: '28px', fontWeight: '800',
              color: 'var(--text)',
              fontFamily: '"Baloo 2", sans-serif',
              letterSpacing: '-0.5px',
              transform: 'translateX(-8px)'
            }}>Welcome back!!</h1>
            <p style={{ margin: 0, color: 'var(--text3)', fontSize: '14px', fontFamily: '"Figtree", sans-serif', transform: 'translateX(-8px)' }}>
              Sign in to your SkillSync account
            </p>
          </div>

          <div style={{
            background: 'rgba(245,158,11,0.07)',
            border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: '12px', padding: '10px 16px',
            fontSize: '12.5px', color: 'var(--text2)',
            textAlign: 'center', marginBottom: '16px'
          }}>
            ⏱ First load may take 30–60 s while the server wakes up
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,80,100,0.08)',
              border: '1px solid rgba(255,80,100,0.2)',
              borderRadius: '12px', padding: '10px 16px',
              fontSize: '13px', color: 'var(--danger)',
              display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '16px'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <div className="auth-card-enter" style={{
            background: 'var(--card)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '22px',
            padding: '28px 28px 24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(var(--indigo-rgb), 0.1) inset'
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              <div className="auth-field">
                <span className="auth-field-label">Email</span>
                <svg className="auth-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
                </svg>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="auth-field">
                <span className="auth-field-label">Password</span>
                <svg className="auth-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  className="auth-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '48px' }}
                />
                <button type="button" className="auth-field-icon-right" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>

              <button className="auth-btn" type="submit" disabled={loading} style={{ marginTop: '4px' }}>
                <span className="shimmer" />
                {loading
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', position: 'relative' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'auth-spin 0.75s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Signing in…
                    </span>
                  : <span style={{ position: 'relative' }}>Sign In →</span>
                }
              </button>

            </form>

            <GoogleSignInButton redirectTo="/dashboard" />
          </div>

          {/* Footer link */}
          <p style={{
            textAlign: 'center', marginTop: '20px',
            fontSize: '13.5px', color: 'rgba(190,180,230,0.4)'
          }}>
            No account?{' '}
            <Link to="/register" style={{
              color: '#c97ff5', fontWeight: '600', textDecoration: 'none',
            }}>
              Create one free
            </Link>
          </p>

        </div>
      </div>
    </>
  )
}
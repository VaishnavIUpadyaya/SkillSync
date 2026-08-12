import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import GoogleSignInButton from '../components/GoogleSignInButton'
import logo from '../assets/logo.png'


export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
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
      const res = await api.post('/auth/register', form)
      await login(res.data.token, res.data.user)
      navigate('/profile')
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed')
    } finally { setLoading(false) }
  }

  const strength = (() => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()
  const strengthMeta = [
    null,
    { label: 'Weak', color: 'var(--danger)' },
    { label: 'Fair', color: 'var(--warning)' },
    { label: 'Good', color: 'var(--success)' },
    { label: 'Strong', color: 'var(--accent)' },
  ][strength]

  return (
    <>
      <style>{`
        .rauth-input:-webkit-autofill,
        .rauth-input:-webkit-autofill:hover,
        .rauth-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px var(--bg) inset !important;
          -webkit-text-fill-color: var(--text) !important;
          border-color: var(--glass-border-hover) !important;
          transition: background-color 9999s ease;
        }

        .rauth-input {
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
          caret-color: var(--accent);
        }
        .rauth-input::placeholder { color: var(--text3); }
        .rauth-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px rgba(var(--indigo-rgb), 0.15);
        }

        .rauth-field {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .rauth-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: rgba(200,190,240,0.45);
        }
        .rauth-icon {
          position: absolute;
          left: 15px;
          bottom: 17px;
          color: rgba(180,170,220,0.35);
          pointer-events: none;
          transition: color 0.2s;
        }
        .rauth-field:focus-within .rauth-icon { color: rgba(233,69,245,0.6); }

        .rauth-eye {
          position: absolute;
          right: 14px;
          bottom: 42px;
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(180,170,220,0.3);
          padding: 4px;
          transition: color 0.2s;
          display: flex;
          align-items: center;
        }
        .rauth-eye:hover { color: var(--accent); }

        .rauth-btn {
          width: 100%;
          height: 40px;
          background: linear-gradient(135deg, var(--accent3), var(--purple-200));
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
        .rauth-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(var(--indigo-rgb), 0.45);
        }
        .rauth-btn:active:not(:disabled) { transform: scale(0.98); }
        .rauth-btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
        .rauth-btn .shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
          background-size: 200% 100%; background-position: -200% center;
          transition: background-position 0.6s;
        }
        .rauth-btn:hover:not(:disabled) .shimmer { background-position: 200% center; }

        .rauth-strength-bar {
          height: 3px; border-radius: 999px;
          background: rgba(255,255,255,0.06);
          margin-top: 8px; overflow: hidden;
        }
        .rauth-strength-fill {
          height: 100%; border-radius: 999px;
          transition: width 0.4s cubic-bezier(0.16,1,0.3,1), background 0.4s;
        }

        @keyframes rauth-rise {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rauth-spin { to { transform: rotate(360deg); } }

        .rauth-page  { animation: rauth-rise 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .rauth-card  { animation: rauth-rise 0.6s 0.08s cubic-bezier(0.16,1,0.3,1) both; }

        .perk-row {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .perk-row:last-child { border-bottom: none; padding-bottom: 0; }
        .perk-icon {
          width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
          background: rgba(233,69,245,0.1);
          display: flex; align-items: center; justify-content: center; font-size: 16px;
        }

        @media (max-width: 740px) {
          .rauth-grid { grid-template-columns: 1fr !important; }
          .rauth-left { display: none !important; }
        }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, zIndex: -1,
background: 'linear-gradient(90deg,rgba(0, 0, 0, 1) 0%, rgba(84, 54, 115, 1) 44%, rgba(109, 10, 120, 1) 100%)'}}>
      </div>

      <div className="rauth-page" style={{
        minHeight: 'calc(100vh - 50px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div className="rauth-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '70px',
          width: '100%',
          maxWidth: '820px',
          alignItems: 'center',
        }}>

          <div className="rauth-left">
            <div style={{ marginBottom: '2px' }}>
              <img 
                src={logo} 
                alt="Synera" 
                style={{ 
                  width: '240px', 
                  height: 'auto', 
                  margin: '-160px 0 -95px -30px', 
                  filter: 'brightness(0) invert(1) opacity(0.9) drop-shadow(0 0 20px rgba(175,139,178,0.6))' 
                }} 
              />
            </div>

            <h2 style={{
              fontSize: '30px', fontWeight: '900', letterSpacing: '-0.8px',
              color: '#ede8ff', margin: '-20px 0 10px',
              fontFamily: 'Cabinet Grotesk, sans-serif', lineHeight: 1.15
            }}>
              Build your dream<br />
              <span style={{
                backgroundImage: 'linear-gradient(120deg, #af8bb2ff, #a9a2e4ff)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent'
              }}>team today.</span>
            </h2>
            <p style={{ color: 'rgba(190,180,230,0.4)', fontSize: '14px', lineHeight: 1.7, margin: '0 0 28px' }}>
              Connect with talented developers, designers, and product folks on real projects.
            </p>

            <div style={{
              background: 'rgba(12,9,28,0.6)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '18px',
              padding: '18px 20px'
            }}>
              {[
                ['🎯', 'Smart matching', 'Find teammates who complement your skill set'],
                ['🚀', 'Real projects', 'Work on meaningful things with actual deadlines'],
                ['✅', 'Verified skills', 'Stand out with cryptographic skill proofs'],
              ].map(([icon, title, desc]) => (
                <div key={title} className="perk-row">
                  <div className="perk-icon">{icon}</div>
                  <div>
                    <div style={{ color: '#d0c8f0', fontWeight: 600, fontSize: '13.5px', marginBottom: '2px' }}>{title}</div>
                    <div style={{ color: 'rgba(180,170,220,0.4)', fontSize: '12.5px', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h1 style={{
                margin: '0 0 1px',
                fontSize: '24px', fontWeight: '800',
                color: '#ede8ff',
                fontFamily: '"Baloo 2", sans-serif',
                letterSpacing: '-0.4px',
                transform: 'translate(-5px,-45px)'
              }}>Create your account</h1>
              <p style={{ margin: 0, color: 'rgba(190,180,230,0.4)', fontSize: '13px', fontFamily: '"Figtree", sans-serif', transform: 'translate(-8px,-40px)' }}>
                Free forever · No credit card needed
              </p>
            </div>

            {error && (
              <div style={{
                background: 'rgba(255,80,100,0.08)',
                border: '1px solid rgba(255,80,100,0.2)',
                borderRadius: '12px', padding: '10px 16px',
                fontSize: '13px', color: '#ff8090',
                display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: '20px'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <div
  className="rauth-card"
  style={{
    background: 'rgba(12,9,28,0.78)',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '22px',
    padding: '26px 26px 22px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(233,69,245,0.06) inset',
marginTop: '-50px'  }}
>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <div className="rauth-field">
                  <span className="rauth-label">Full name</span>
                  <svg className="rauth-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                  <input className="rauth-input" type="text" placeholder="Enter your full name"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    required autoComplete="name" />
                </div>

                <div className="rauth-field">
                  <span className="rauth-label">Email address</span>
                  <svg className="rauth-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
                  </svg>
                  <input className="rauth-input" type="email" placeholder="Enter valid email address"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    required autoComplete="email" />
                </div>

                <div className="rauth-field">
                  <span className="rauth-label">Password</span>
                  <svg className="rauth-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input className="rauth-input" type={showPass ? 'text' : 'password'} placeholder="Min 8 characters"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    required autoComplete="new-password" style={{ paddingRight: '48px' }} />
                  <button type="button" className="rauth-eye" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                    {showPass
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                  {form.password && (
                    <div style={{ marginTop: '2px' }}>
                      <div className="rauth-strength-bar">
                        <div className="rauth-strength-fill" style={{
                          width: `${strength * 25}%`,
                          background: strengthMeta?.color
                        }} />
                      </div>
                      <div style={{ fontSize: '11px', color: strengthMeta?.color, textAlign: 'right', marginTop: '3px', fontWeight: 600 }}>
                        {strengthMeta?.label}
                      </div>
                    </div>
                  )}
                </div>

                <button className="rauth-btn" type="submit" disabled={loading} style={{ marginTop: '4px' }}>
                  <span className="shimmer" />
                  {loading
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', position: 'relative' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'rauth-spin 0.75s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        Creating account…
                      </span>
                    : <span style={{ position: 'relative' }}>Create Free Account →</span>
                  }
                </button>
              </form>
              <GoogleSignInButton redirectTo="/profile" />
            </div>

            <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '13.5px', color: 'rgba(190,180,230,0.4)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#c97ff5', fontWeight: '600', textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
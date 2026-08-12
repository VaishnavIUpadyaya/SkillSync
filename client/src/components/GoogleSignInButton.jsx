import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import toast from 'react-hot-toast'

export default function GoogleSignInButton({ redirectTo = '/dashboard' }) {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const handleGoogleToken = useCallback(async (credential) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/google', { credential })
      await login(res.data.token, res.data.user)
      toast.success('Signed in with Google! 🎉')
      navigate(redirectTo)
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }, [login, navigate, redirectTo])

  useEffect(() => {
    if (!clientId) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              handleGoogleToken(response.credential)
            }
          }
        })

        const btnContainer = document.getElementById('google-btn-container')
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'filled_dark',
            size: 'large',
            width: '100%',
            shape: 'pill',
            text: 'continue_with'
          })
        }
      }
    }
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [clientId, handleGoogleToken])

  const handleClickFallback = () => {
    if (!clientId) {
      toast.error('Google Client ID not configured yet. Add VITE_GOOGLE_CLIENT_ID to client/.env', {
        duration: 5000
      })
      return
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt()
    }
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0', gap: '12px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
        <span style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>or</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
      </div>

      {clientId ? (
        <div id="google-btn-container" style={{ width: '100%', minHeight: '44px', display: 'flex', justifyContent: 'center' }} />
      ) : (
        <button
          type="button"
          onClick={handleClickFallback}
          disabled={loading}
          style={{
            width: '100%',
            height: '48px',
            background: 'var(--card)',
            border: '1px solid var(--glass-border)',
            borderRadius: '14px',
            color: 'var(--text)',
            fontSize: '14.5px',
            fontWeight: '600',
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'background 0.2s, border-color 0.2s, transform 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--glass-hover)'
            e.currentTarget.style.borderColor = 'var(--glass-border-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--card)'
            e.currentTarget.style.borderColor = 'var(--glass-border)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.28v3.15C3.25 21.3 7.31 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.28C.46 8.2 0 10.04 0 12s.46 3.8 1.28 5.42l4-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.58l4 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          {loading ? 'Connecting to Google...' : 'Sign in with Google'}
        </button>
      )}
    </div>
  )
}

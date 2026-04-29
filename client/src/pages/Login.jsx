import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      await login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed')
    } finally { setLoading(false) }
  }

  const inputStyle = {
    background: 'var(--navy3)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '12px 16px', color: 'var(--text)',
    fontSize: '14px', width: '100%', outline: 'none',
    transition: 'border-color 0.2s', fontFamily: 'DM Sans, sans-serif',
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '8px' }}>Welcome back</h1>
          <p style={{ color: 'var(--text2)', fontSize: '15px' }}>Sign in to your SkillSync account</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,94,108,0.1)', border: '1px solid rgba(255,94,108,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: 'var(--danger)', fontSize: '14px' }}>
            {error}
          </div>
        )}
        <div style={{
  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
  borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
  fontSize: '12px', color: '#f59e0b', textAlign: 'center'
}}>
  First load may take 30-60 seconds as the server wakes up
</div>

        <form onSubmit={handleSubmit} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>Email</label>
            <input style={inputStyle} type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} required />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>Password</label>
            <input style={inputStyle} type="password" placeholder="password"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} required />
          </div>
          <button type="submit" disabled={loading} style={{
            background: loading ? 'var(--border)' : 'var(--accent3)', color: 'white',
            border: 'none', borderRadius: '10px', padding: '13px',
            fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Syne, sans-serif', transition: 'all 0.2s', marginTop: '4px',
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text2)' }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--accent3)', textDecoration: 'none', fontWeight: '500' }}>Create one</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
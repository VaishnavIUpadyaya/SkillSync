import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.token, res.data.user)
      navigate('/profile')
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed')
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
          <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px', marginBottom: '8px' }}>Join SkillSync</h1>
          <p style={{ color: 'var(--text2)', fontSize: '15px' }}>Find your perfect project team</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,94,108,0.1)', border: '1px solid rgba(255,94,108,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: 'var(--danger)', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[['Name', 'text', 'Full Name', 'name'], ['Email', 'email', 'you@example.com', 'email'], ['Password', 'password', 'password', 'password']].map(([label, type, ph, key]) => (
            <div key={key}>
              <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>{label}</label>
              <input style={inputStyle} type={type} placeholder={ph}
                value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} required />
            </div>
          ))}
          <button type="submit" disabled={loading} style={{
            background: loading ? 'var(--border)' : 'var(--accent2)', color: 'white',
            border: 'none', borderRadius: '10px', padding: '13px',
            fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Syne, sans-serif', transition: 'all 0.2s', marginTop: '4px',
          }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text2)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent2)', textDecoration: 'none', fontWeight: '500' }}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Card from '../components/Card'

const ROLES = ['Frontend', 'Backend', 'Full Stack', 'ML/AI', 'DevOps', 'Designer', 'Other']

const inputStyle = {
  background: 'var(--navy3)', border: '1px solid var(--border)',
  borderRadius: '10px', padding: '11px 14px', color: 'var(--text)',
  fontSize: '14px', width: '100%', outline: 'none',
  transition: 'border-color 0.2s', fontFamily: 'DM Sans, sans-serif',
}

export default function Profile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({ name: '', role: '', available: true, skills: [] })
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 3 })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) setForm({ name: user.name, role: user.role || '', available: user.available ?? true, skills: user.skills || [] })
  }, [user])

  const addSkill = () => {
    if (!newSkill.name.trim()) return
    setForm({ ...form, skills: [...form.skills, { ...newSkill }] })
    setNewSkill({ name: '', proficiency: 3 })
  }

  const removeSkill = (i) => setForm({ ...form, skills: form.skills.filter((_, idx) => idx !== i) })

  const handleSave = async () => {
    try {
      const res = await api.put('/users/me', form)
      setUser(res.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) { console.error(err) }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '24px' }}>My Profile</h1>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>Full Name</label>
            <input style={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>Role</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              <option value="">Select role</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <div onClick={() => setForm({...form, available: !form.available})} style={{
            width: '40px', height: '22px', borderRadius: '11px', position: 'relative',
            background: form.available ? 'var(--accent)' : 'var(--border)',
            transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0,
          }}>
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%', background: 'white',
              position: 'absolute', top: '3px', transition: 'left 0.2s',
              left: form.available ? '21px' : '3px',
            }} />
          </div>
          <span style={{ fontSize: '14px', color: form.available ? 'var(--success)' : 'var(--text2)' }}>
            {form.available ? 'Available for projects' : 'Not available'}
          </span>
        </label>

        <div>
          <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '10px', display: 'block' }}>Skills</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', minHeight: '32px' }}>
            {form.skills.map((s, i) => (
              <span key={i} style={{
                background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)',
                color: 'var(--accent2)', padding: '4px 10px', borderRadius: '6px',
                fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                {s.name} <span style={{ color: 'var(--text3)' }}>{s.proficiency}/5</span>
                <button onClick={() => removeSkill(i)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="e.g. React, Python..."
              value={newSkill.name} onChange={e => setNewSkill({...newSkill, name: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && addSkill()}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            <select style={{ ...inputStyle, width: '80px' }} value={newSkill.proficiency}
              onChange={e => setNewSkill({...newSkill, proficiency: Number(e.target.value)})}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}/5</option>)}
            </select>
            <button onClick={addSkill} style={{
              background: 'var(--accent2)', color: 'white', border: 'none',
              borderRadius: '10px', padding: '0 18px', fontWeight: '600',
              cursor: 'pointer', fontSize: '14px', fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap'
            }}>Add</button>
          </div>
        </div>

        <button onClick={handleSave} style={{
          background: saved ? 'rgba(34,211,165,0.15)' : 'var(--accent2)',
          color: saved ? 'var(--success)' : 'white',
          border: saved ? '1px solid rgba(34,211,165,0.3)' : 'none',
          borderRadius: '10px', padding: '13px', fontSize: '15px',
          fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif',
          transition: 'all 0.3s'
        }}>
          {saved ? 'Saved!' : 'Save Profile'}
        </button>
      </Card>
    </div>
  )
}
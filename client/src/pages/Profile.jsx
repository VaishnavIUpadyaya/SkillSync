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
  const [availableDates, setAvailableDates] = useState([])
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [dateSaved, setDateSaved] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        role: user.role || '',
        available: user.available ?? true,
        skills: user.skills || []
      })
      setAvailableDates(user.availableDates || [])
    }
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

  const saveDates = async () => {
    try {
      const res = await api.put('/users/availability', { availableDates })
      setUser(res.data)
      setDateSaved(true)
      setTimeout(() => setDateSaved(false), 2000)
    } catch (err) { console.error(err) }
  }

  const toggleDate = (dateStr) => {
    setAvailableDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    )
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth, year, month }
  }

  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const isToday = (year, month, day) => {
    const today = new Date()
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
  }

  const isPast = (year, month, day) => {
    const date = new Date(year, month, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const { firstDay, daysInMonth, year, month } = getDaysInMonth(calendarMonth)
  const monthName = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '24px' }}>My Profile</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>Full Name</label>
              <input style={inputStyle} value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>Role</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.role}
                onChange={e => setForm({...form, role: e.target.value})}>
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
                  <button onClick={() => removeSkill(i)} style={{
                    background: 'none', border: 'none', color: 'var(--text3)',
                    cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0
                  }}>×</button>
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
                background: 'var(--accent3)', color: 'white', border: 'none',
                borderRadius: '10px', padding: '0 18px', fontWeight: '600',
                cursor: 'pointer', fontSize: '14px', fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap'
              }}>Add</button>
            </div>
          </div>

          <button onClick={handleSave} style={{
            background: saved ? 'rgba(34,211,165,0.15)' : 'var(--accent3)',
            color: saved ? 'var(--success)' : 'white',
            border: saved ? '1px solid rgba(34,211,165,0.3)' : 'none',
            borderRadius: '10px', padding: '13px', fontSize: '15px',
            fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif',
            transition: 'all 0.3s'
          }}>
            {saved ? 'Saved!' : 'Save Profile'}
          </button>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Availability</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{availableDates.length} days selected</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <button onClick={() => setCalendarMonth(new Date(year, month - 1))} style={{
              background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--text2)',
              borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '14px'
            }}>‹</button>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>{monthName}</span>
            <button onClick={() => setCalendarMonth(new Date(year, month + 1))} style={{
              background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--text2)',
              borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '14px'
            }}>›</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '8px' }}>
            {days.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text3)', padding: '4px 0', fontWeight: '600' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = formatDate(year, month, day)
              const selected = availableDates.includes(dateStr)
              const past = isPast(year, month, day)
              const today = isToday(year, month, day)
              return (
                <button key={day} onClick={() => !past && toggleDate(dateStr)} style={{
                  aspectRatio: '1', borderRadius: '6px', border: 'none', fontSize: '12px',
                  fontWeight: today ? '700' : '400',
                  background: selected ? 'var(--accent3)' : today ? 'rgba(108,99,255,0.15)' : 'var(--navy3)',
                  color: selected ? 'white' : past ? 'var(--text3)' : today ? 'var(--accent2)' : 'var(--text)',
                  cursor: past ? 'default' : 'pointer',
                  opacity: past ? 0.4 : 1,
                  transition: 'all 0.15s',
                  outline: today ? '1px solid var(--accent)' : 'none'
                }}>{day}</button>
              )
            })}
          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', background: 'var(--accent)', borderRadius: '2px', display: 'inline-block' }} /> Available
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', background: 'rgba(108,99,255,0.15)', borderRadius: '2px', display: 'inline-block', outline: '1px solid var(--accent)' }} /> Today
            </span>
          </div>

          <button onClick={saveDates} style={{
            marginTop: '16px', width: '100%',
            background: dateSaved ? 'rgba(34,211,165,0.15)' : 'var(--navy3)',
            color: dateSaved ? 'var(--success)' : 'var(--text2)',
            border: `1px solid ${dateSaved ? 'rgba(34,211,165,0.3)' : 'var(--border)'}`,
            borderRadius: '10px', padding: '10px', fontSize: '14px',
            fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s'
          }}>
            {dateSaved ? 'Dates Saved!' : 'Save Availability'}
          </button>
        </Card>
      </div>
    </div>
  )
}
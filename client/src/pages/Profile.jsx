import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Card from '../components/Card'
import SkillTag from '../components/SkillTag'
import { useNavigate } from 'react-router-dom'

const ROLES = ['Frontend', 'Backend', 'Full Stack', 'ML/AI', 'DevOps', 'Designer', 'Other']

const inputStyle = {
  background: 'var(--navy3)', border: '1px solid var(--border)',
  borderRadius: '10px', padding: '11px 14px', color: 'var(--text)',
  fontSize: '14px', width: '100%', outline: 'none',
  transition: 'border-color 0.2s', fontFamily: 'DM Sans, sans-serif',
}

const proficiencyLevels = [
  { level: 1, label: 'B', color: '#ef4444' },
  { level: 2, label: 'F', color: '#f97316' },
  { level: 3, label: 'I', color: '#f59e0b' },
  { level: 4, label: 'A', color: '#22c55e' },
  { level: 5, label: 'E', color: '#6c63ff' },
]

export default function Profile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({ name: '', role: '', available: true, skills: [] })
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 3 })
  const [saved, setSaved] = useState(false)
  const [availableDates, setAvailableDates] = useState([])
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [dateSaved, setDateSaved] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [endorsements, setEndorsements] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        role: user.role || '',
        available: user.available ?? true,
        skills: user.skills || []
      })
      setAvailableDates(user.availableDates || [])
      
      // Fetch public-style data for the view mode
      api.get(`/users/${user._id}/profile`).then(r => setProfileData(r.data))
      api.get(`/endorsements/${user._id}`).then(r => setEndorsements(r.data))
    }
  }, [user])

  const addSkill = () => {
    if (!newSkill.name.trim()) return
    setForm({ ...form, skills: [...form.skills, { ...newSkill }] })
    setNewSkill({ name: '', proficiency: 3 })
  }

  const removeSkill = (i) => setForm({ ...form, skills: form.skills.filter((_, idx) => idx !== i) })

  const handleSave = async () => {
    if (!form.role) {
      setSaved(false)
      alert('Please select a role before saving')
      return
    }
    try {
      const res = await api.put('/users/me', form)
      setUser(res.data)
      setSaved(true)
      setIsEditing(false)
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
  const stars = (score) => '★'.repeat(score) + '☆'.repeat(5 - score)

  if (!user || (!isEditing && !profileData)) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text3)' }}>Loading...</div>
  )

  if (isEditing) {
    return (
      <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Edit Profile</h1>
          <button onClick={() => setIsEditing(false)} style={{
            background: 'none', border: '1px solid var(--border)', color: 'var(--text2)',
            borderRadius: '8px', padding: '6px 14px', fontSize: '14px', cursor: 'pointer'
          }}>Cancel</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', minWidth: 0 }}>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
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
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.role} required onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="">Select role</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
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
                  {s.name}
                  <span style={{ color: 'var(--text3)', fontSize: '11px' }}>
                    {s.proficiency === 1 ? 'Beginner' : s.proficiency === 2 ? 'Familiar' : s.proficiency === 3 ? 'Intermediate' : s.proficiency === 4 ? 'Advanced' : 'Expert'}
                  </span>
                  {s.verified && <span style={{ color: 'var(--success)', fontSize: '11px' }}>✓</span>}
                  <button onClick={() => removeSkill(i)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
                </span>
              ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="Skill name"
                  value={newSkill.name} onChange={e => setNewSkill({...newSkill, name: e.target.value})}
                  onKeyDown={e => e.key === 'Enter' && addSkill()}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                <div style={{ display: 'flex', gap: '4px' }}>
                 {proficiencyLevels.map(({ level, label, color }) => (
  <button
    key={level}
    type="button"
    onClick={() => setNewSkill({ ...newSkill, proficiency: level })}
    title={label}
    style={{
      width: '32px',
      height: '36px',
      borderRadius: '6px',
      border: 'none',
      fontSize: '11px',
      fontWeight: '600',
      cursor: 'pointer',

      transition: 'all 0.25s ease',

      background: newSkill.proficiency === level ? color : 'var(--border)',
color: newSkill.proficiency === level ? 'white' : 'var(--text3)',
      color: newSkill.proficiency >= level ? 'white' : 'var(--text3)',

      transform: newSkill.proficiency === level ? 'scale(1.1)' : 'scale(1)',
      boxShadow: newSkill.proficiency >= level
        ? '0 4px 12px rgba(0,0,0,0.2)'
        : 'none',
    }}

    onMouseEnter={e => {
      e.target.style.transform = 'scale(1.15)'
      e.target.style.filter = 'brightness(1.1)'
    }}

    onMouseLeave={e => {
      e.target.style.transform =
        newSkill.proficiency === level ? 'scale(1.1)' : 'scale(1)'
      e.target.style.filter = 'brightness(1)'
    }}

    onMouseDown={e => {
      e.target.style.transform = 'scale(0.95)'
    }}

    onMouseUp={e => {
      e.target.style.transform =
        newSkill.proficiency === level ? 'scale(1.1)' : 'scale(1)'
    }}
  >
    {label}
  </button>
))}
                </div>
                <button onClick={addSkill} style={{
                  background: 'var(--accent3)', color: 'white', border: 'none', borderRadius: '10px', padding: '0 17px', fontWeight: '600',
                  cursor: 'pointer', fontSize: '14px', fontFamily: 'Syne, sans-serif', whiteSpace: 'nowrap'
                }}>Add</button>
              </div>
            </div>

            <button onClick={handleSave} style={{
              background: saved ? 'rgba(34,211,165,0.15)' : 'var(--accent3)', color: saved ? 'var(--success)' : 'white',
              border: saved ? '1px solid rgba(34,211,165,0.3)' : 'none', borderRadius: '10px', padding: '13px', fontSize: '15px',
              fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif', transition: 'all 0.3s'
            }}>{saved ? 'Saved!' : 'Save Profile'}</button>
          </Card>

          <Card style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Availability</p>
              <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{availableDates.length} days selected</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <button onClick={() => setCalendarMonth(new Date(year, month - 1))} style={{ background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '14px' }}>‹</button>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{monthName}</span>
              <button onClick={() => setCalendarMonth(new Date(year, month + 1))} style={{ background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '14px' }}>›</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '8px' }}>
              {days.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text3)', padding: '4px 0', fontWeight: '600' }}>{d}</div>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1; const dateStr = formatDate(year, month, day); const selected = availableDates.includes(dateStr); const past = isPast(year, month, day); const today = isToday(year, month, day)
                return <button key={day} onClick={() => !past && toggleDate(dateStr)} style={{
                  aspectRatio: '1', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: today ? '700' : '400',
                  background: selected ? 'var(--accent3)' : today ? 'rgba(108,99,255,0.15)' : 'var(--navy3)', color: selected ? 'white' : past ? 'var(--text3)' : today ? 'var(--accent2)' : 'var(--text)',
                  cursor: past ? 'default' : 'pointer', opacity: past ? 0.4 : 1, transition: 'all 0.15s', outline: today ? '1px solid var(--accent)' : 'none'
                }}>{day}</button>
              })}
            </div>
            <button onClick={saveDates} style={{
              marginTop: '16px', width: '100%', background: dateSaved ? 'rgba(34,211,165,0.15)' : 'var(--navy3)', color: dateSaved ? 'var(--success)' : 'var(--text2)',
              border: `1px solid ${dateSaved ? 'rgba(34,211,165,0.3)' : 'var(--border)'}`, borderRadius: '10px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s'
            }}>{dateSaved ? 'Dates Saved!' : 'Save Availability'}</button>
          </Card>
        </div>
      </div>
    )
  }

  const { projects, ratings } = profileData
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>My Profile</h1>
        <button onClick={() => setIsEditing(true)} style={{
          background: 'var(--accent3)', color: 'white', border: 'none',
          borderRadius: '10px', padding: '10px 18px', fontSize: '14px',
          fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
           Edit Profile
        </button>
      </div>

      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', fontSize: '24px', fontFamily: 'Syne, sans-serif', flexShrink: 0
          }}>{user.name[0].toUpperCase()}</div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>{user.name}</h1>
            <p style={{ fontSize: '14px', color: 'var(--text2)', marginTop: '2px' }}>{user.role || 'No role set'}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
              {user.rating > 0 && (
                <span style={{ fontSize: '13px', color: '#f59e0b' }}>★ {user.rating}/5 ({user.ratingCount} reviews)</span>
              )}
              <span style={{
                fontSize: '12px', padding: '2px 10px', borderRadius: '20px',
                background: user.available ? 'rgba(34,211,165,0.1)' : 'rgba(255,94,108,0.1)',
                color: user.available ? 'var(--success)' : 'var(--danger)',
                border: `1px solid ${user.available ? 'rgba(34,211,165,0.2)' : 'rgba(255,94,108,0.2)'}`
              }}>{user.available ? 'Available' : 'Not Available'}</span>
            </div>
          </div>
        </div>

        {user.availableDates?.length > 0 && (
          <div style={{ marginBottom: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Dates</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {user.availableDates.sort().slice(0, 10).map(d => (
                <span key={d} style={{
                  fontSize: '12px', padding: '3px 10px', borderRadius: '6px',
                  background: 'rgba(34,211,165,0.1)', color: 'var(--success)',
                  border: '1px solid rgba(34,211,165,0.2)'
                }}>{new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skills</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {user.skills.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--navy3)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <SkillTag name={s.name} proficiency={s.proficiency} verified={s.verified} />
                {endorsements[s.name]?.length > 0 && (
                  <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                    endorsed by {endorsements[s.name].length} people
                  </span>
                )}
              </div>
              {!s.verified && (
                <button onClick={() => navigate('/verify-skill', { state: { skill: s.name, proficiency: s.proficiency } })} style={{
                  background: 'rgba(108,99,255,0.12)', color: 'var(--accent2)',
                  border: '1px solid rgba(108,99,255,0.25)', borderRadius: '8px',
                  padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                }}>Verify Skill</button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Projects ({projects.length})</p>
        {projects.map(p => (
          <div key={p._id} onClick={() => navigate(`/projects/${p._id}`)} style={{ padding: '12px', borderRadius: '10px', marginBottom: '8px', background: 'var(--navy3)', border: '1px solid var(--border)', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', fontSize: '14px' }}>{p.title}</span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: p.status === 'completed' ? 'rgba(245,158,11,0.1)' : 'rgba(108,99,255,0.1)', color: p.status === 'completed' ? '#f59e0b' : 'var(--accent2)', border: `1px solid ${p.status === 'completed' ? 'rgba(245,158,11,0.2)' : 'rgba(108,99,255,0.2)'}` }}>{p.status}</span>
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reviews ({ratings.length})</p>
        {ratings.map(r => (
          <div key={r._id} style={{ padding: '14px', borderRadius: '10px', marginBottom: '10px', background: 'var(--navy3)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600' }}>{r.rater.name}</span>
              <span style={{ fontSize: '14px', color: '#f59e0b', letterSpacing: '2px' }}>{stars(r.score)}</span>
            </div>
            {r.project && <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>on {r.project.title}</p>}
            {r.comment && <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '6px' }}>{r.comment}</p>}
          </div>
        ))}
      </Card>
    </div>
  )
}
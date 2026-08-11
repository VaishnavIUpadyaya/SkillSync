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
  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    role: user?.role || '',
    skills: user?.skills || [],
    bio: user?.bio || ''
  }))
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 3 })
  const [saved, setSaved] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [endorsements, setEndorsements] = useState({})
  const [uploading, setUploading] = useState(false)
  const [previewPic, setPreviewPic] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      setTimeout(() => {
        setForm({
          name: user.name,
          role: user.role || '',
          skills: user.skills || [],
          bio: user.bio || ''
        })
      }, 0)
      
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

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploading(true)
      const reader = new FileReader()
      reader.onload = async (event) => {
        setPreviewPic(event.target.result)
      }
      reader.readAsDataURL(file)

      const formData = new FormData()
      formData.append('profilePic', file)

      const res = await api.post('/users/upload-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUser(res.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
      alert('Failed to upload profile picture')
    } finally {
      setUploading(false)
    }
  }

  const stars = (score) => '★'.repeat(score) + '☆'.repeat(5 - score)
  if (!user || (!isEditing && !profileData)) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text3)' }}>Loading...</div>
  )

  if (isEditing) {
    return (
      <div className="page-container" style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem', boxSizing: 'border-box' }}>
        <div className="profile-edit-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Edit Profile</h1>
          <button onClick={() => setIsEditing(false)} style={{
            background: 'none', border: '1px solid var(--border)', color: 'var(--text2)',
            borderRadius: '8px', padding: '6px 14px', fontSize: '14px', cursor: 'pointer'
          }}>Cancel</button>
        </div>

        <div className="profile-edit-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', minWidth: 0 }}>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%', background: user?.profilePic ? 'transparent' : 'var(--accent2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '800', fontSize: '32px', fontFamily: 'Syne, sans-serif', flexShrink: 0,
                overflow: 'hidden', position: 'relative'
              }}>
                {user?.profilePic || previewPic ? (
                  <img src={previewPic || user.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user?.name[0].toUpperCase()
                )}
              </div>
              <label style={{
                background: 'var(--accent3)', color: 'white', border: 'none',
                borderRadius: '8px', padding: '8px 16px', fontSize: '13px',
                fontWeight: '600', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif',
                opacity: uploading ? 0.6 : 1, transition: 'opacity 0.2s'
              }}>
                {uploading ? 'Uploading...' : 'Change Picture'}
                <input type="file" accept="image/*" onChange={handleProfilePicChange} style={{ display: 'none' }} disabled={uploading} />
              </label>
            </div>

            <div className="profile-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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

            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>Bio (optional)</label>
              <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} style={{ ...inputStyle, height: '100px', resize: 'vertical' }} placeholder="A short bio about you, your focus and experience." />
            </div>

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

        </div>
      </div>
    )
  }

  const { projects, ratings } = profileData
  const profileUserId = profileData?.user?._id || user?._id
  const leaderProjects = projects.filter((p) => {
    const ownerId = p.owner?._id || p.owner
    return ownerId?.toString() === profileUserId?.toString()
  })
  const memberProjects = projects.filter((p) => {
    const ownerId = p.owner?._id || p.owner
    return ownerId?.toString() !== profileUserId?.toString()
  })

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      <div className="profile-view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
            width: '64px', height: '64px', borderRadius: '50%', background: user?.profilePic ? 'transparent' : 'var(--accent2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', fontSize: '24px', fontFamily: 'Syne, sans-serif', flexShrink: 0,
            overflow: 'hidden'
          }}>
            {user?.profilePic ? (
              <img src={user.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.name[0].toUpperCase()
            )}
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>{user.name}</h1>
            <p style={{ fontSize: '14px', color: 'var(--text2)', marginTop: '2px' }}>{user.role || 'No role set'}</p>
            {user.bio && (
              <p style={{ fontSize: '14px', color: 'var(--text3)', marginTop: '10px', lineHeight: 1.7, maxWidth: '680px' }}>{user.bio}</p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
              {user.rating > 0 && (
                <span style={{ fontSize: '13px', color: '#f59e0b' }}>★ {user.rating}/5 ({user.ratingCount} reviews)</span>
              )}
            </div>
          </div>
        </div>

        {/* Profile completion indicator */}
        {(() => {
          const hasName = Boolean(user.name && user.name.trim())
          const hasRole = Boolean(user.role && user.role.trim())
          const skillCount = Array.isArray(user.skills) ? user.skills.length : 0
          const hasThreeSkills = skillCount >= 3
          const hasVerified = (user.skills || []).some(s => s.verified)
          const hasBio = Boolean(user.bio && user.bio.trim())
          const total = [hasName, hasRole, hasThreeSkills, hasVerified, hasBio].filter(Boolean).length
          const pct = Math.round((total / 5) * 100)
          const suggestions = []
          if (!hasRole) suggestions.push('add a role')
          if (!hasThreeSkills) suggestions.push('add at least 3 skills')
          if (!hasVerified) suggestions.push('verify a skill')
          if (!hasBio) suggestions.push('add a bio')

          return (
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 700 }}>Profile Completion</div>
                <div style={{ fontSize: '13px', color: 'var(--text3)', fontWeight: 600 }}>{pct}% complete</div>
              </div>

              <div style={{ height: '12px', background: 'var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--accent2)' : 'var(--danger)', transition: 'width 0.4s' }} />
              </div>

              <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text3)' }}>
                {pct === 100 ? (
                  'Your profile is complete — great job! This helps improve your match ranking.'
                ) : (
                  `Your profile is ${pct}% complete — ${suggestions.join(', ')} to improve your match ranking.`
                )}
              </div>
            </div>
          )
        })()}

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

        {leaderProjects.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team leader</p>
            {leaderProjects.map((p) => (
              <div key={p._id} onClick={() => navigate(`/projects/${p._id}`)} style={{ padding: '12px', borderRadius: '10px', marginBottom: '8px', background: 'var(--navy3)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <div>
                    <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>{p.title}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px', display: 'block' }}>Team Leader</span>
                  </div>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: p.status === 'completed' ? 'rgba(245,158,11,0.1)' : 'rgba(108,99,255,0.1)', color: p.status === 'completed' ? '#f59e0b' : 'var(--accent2)', border: `1px solid ${p.status === 'completed' ? 'rgba(245,158,11,0.2)' : 'rgba(108,99,255,0.2)'}` }}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {memberProjects.length > 0 && (
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Other projects</p>
            {memberProjects.map((p) => (
              <div key={p._id} onClick={() => navigate(`/projects/${p._id}`)} style={{ padding: '12px', borderRadius: '10px', marginBottom: '8px', background: 'var(--navy3)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{p.title}</span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: p.status === 'completed' ? 'rgba(245,158,11,0.1)' : 'rgba(108,99,255,0.1)', color: p.status === 'completed' ? '#f59e0b' : 'var(--accent2)', border: `1px solid ${p.status === 'completed' ? 'rgba(245,158,11,0.2)' : 'rgba(108,99,255,0.2)'}` }}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
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
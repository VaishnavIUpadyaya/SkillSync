import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Card from '../components/Card'
import SkillTag from '../components/SkillTag'
import ChatDrawer from '../components/ChatDrawer'
import ResourceHub from '../components/ResourceHub'

const TAGS = ['Web Dev', 'ML/AI', 'Mobile', 'Research', 'Game Dev', 'DevOps', 'Design', 'Other']

const inputStyle = {
  background: 'var(--glass)', border: '1px solid var(--glass-border)',
  borderRadius: '10px', padding: '10px 14px', color: 'var(--text)',
  fontSize: '14px', width: '100%', outline: 'none',
  transition: 'border-color 0.2s', fontFamily: 'DM Sans, sans-serif',
  boxSizing: 'border-box'
}

const profLevels = [
  { level: 1, label: 'B', color: '#ef4444' },
  { level: 2, label: 'F', color: '#f97316' },
  { level: 3, label: 'I', color: '#f59e0b' },
  { level: 4, label: 'A', color: '#22c55e' },
  { level: 5, label: 'E', color: '#6c63ff' },
]

const tagColor = (tag) => {
  const colors = {
    'Web Dev': '#6c63ff', 'ML/AI': '#22d3a5', 'Mobile': '#f59e0b',
    'Research': '#ec4899', 'Game Dev': '#ef4444', 'DevOps': '#3b82f6',
    'Design': '#a855f7', 'Other': '#6b7280'
  }
  return colors[tag] || '#6c63ff'
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [requestStatus, setRequestStatus] = useState('none') // 'none' | 'pending' | 'accepted' | 'rejected'
  const [requestId, setRequestId] = useState(null)
  const [msg, setMsg] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [ratings, setRatings] = useState({})
  const [rated, setRated] = useState({})
  const [ratingMsg, setRatingMsg] = useState('')
  const [bookmarked, setBookmarked] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 3 })
  const [editMsg, setEditMsg] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/projects/${id}`).then(r => {
      setProject(r.data)
      // Pre-fill edit form
      setEditForm({
        title: r.data.title,
        description: r.data.description,
        teamSize: r.data.teamSize,
        deadline: r.data.deadline ? new Date(r.data.deadline).toISOString().split('T')[0] : '',
        githubRepo: r.data.githubRepo || '',
        tags: r.data.tags || [],
        requiredSkills: r.data.requiredSkills || []
      })
      if (r.data.members) {
        r.data.members.forEach(m => {
          if (m._id !== user?._id) {
            api.get(`/ratings/check/${id}/${m._id}`)
              .then(res => setRated(prev => ({ ...prev, [m._id]: res.data.rated })))
              .catch(() => {})
          }
        })
      }
    })
    api.get('/users/me').then(u => {
      setBookmarked(u.data.bookmarks?.some(b => b.toString() === id) || false)
    })
    // Check current user's request status for this project
    api.get(`/requests/status/${id}`)
      .then(r => {
        setRequestStatus(r.data.status || 'none')
        setRequestId(r.data.requestId || null)
      })
      .catch(() => {})
  }, [id, user])

  const isOwner = project?.owner._id === user?._id
  const isMember = project?.members.some(m => m._id === user?._id)
  const isCompleted = project?.status === 'completed'

  const toggleBookmark = async () => {
    const res = await api.post(`/users/bookmarks/${id}`)
    setBookmarked(res.data.bookmarked)
  }

  const sendRequest = async () => {
    try {
      const res = await api.post('/requests', { projectId: id })
      setRequestStatus('pending')
      setRequestId(res.data._id)
      setMsg('Request sent successfully!')
    } catch (err) { setMsg(err.response?.data?.msg || 'Error') }
  }

  const withdrawRequest = async () => {
    if (!window.confirm('Withdraw your join request?')) return
    try {
      await api.delete(`/requests/${requestId}/withdraw`)
      setRequestStatus('none')
      setRequestId(null)
      setMsg('Request withdrawn.')
    } catch (err) { setMsg(err.response?.data?.msg || 'Error withdrawing request') }
  }

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return
    await api.delete(`/projects/${id}/members/${userId}`)
    setProject({ ...project, members: project.members.filter(m => m._id !== userId) })
  }

  const leaveProject = async () => {
    if (!window.confirm('Are you sure you want to leave this project?')) return
    try {
      await api.delete(`/projects/${id}/leave`)
      navigate('/projects')
    } catch (err) {
      setMsg(err.response?.data?.msg || 'Error leaving project')
    }
  }

  const deleteProject = async () => {
    if (!window.confirm('Delete this project permanently?')) return
    await api.delete(`/projects/${id}`)
    navigate('/projects')
  }

  const changeStatus = async (newStatus) => {
    try {
      await api.patch(`/projects/${id}/status`, { status: newStatus })
      setProject({ ...project, status: newStatus })
      setStatusMsg('Status updated!')
      setTimeout(() => setStatusMsg(''), 2000)
    } catch (err) {
      setStatusMsg(err.response?.data?.msg || 'Error')
    }
  }

  const getSkillGap = () => {
    if (!project || !user) return []
    const userSkills = project.members.find(m => m._id === user._id)?.skills || []
    return project.requiredSkills.map(req => {
      const has = userSkills.find(s =>
        s.name.toLowerCase().replace(/\./g, '').replace(/\s+/g, '') ===
        req.name.toLowerCase().replace(/\./g, '').replace(/\s+/g, '')
      )
      return {
        name: req.name,
        required: req.proficiency,
        has: has ? has.proficiency : 0,
        status: !has ? 'missing' : has.proficiency < req.proficiency ? 'low' : 'good'
      }
    })
  }

  const submitRating = async (rateeId) => {
    const r = ratings[rateeId]
    if (!r?.score) return setRatingMsg('Please select a score first')
    try {
      await api.post('/ratings', { rateeId, projectId: id, score: r.score, comment: r.comment || '' })
      setRated(prev => ({ ...prev, [rateeId]: true }))
      setRatingMsg('Rating submitted!')
      setTimeout(() => setRatingMsg(''), 2000)
    } catch (err) {
      setRatingMsg(err.response?.data?.msg || 'Error')
    }
  }

  const addEditSkill = () => {
    if (!newSkill.name.trim()) return
    setEditForm(f => ({ ...f, requiredSkills: [...f.requiredSkills, { ...newSkill }] }))
    setNewSkill({ name: '', proficiency: 3 })
  }
  const removeEditSkill = (i) => setEditForm(f => ({ ...f, requiredSkills: f.requiredSkills.filter((_, idx) => idx !== i) }))
  const toggleEditTag = (tag) => setEditForm(f => ({
    ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag]
  }))

  const saveEdit = async () => {
    try {
      const res = await api.put(`/projects/${id}`, editForm)
      setProject(prev => ({ ...prev, ...res.data }))
      setShowEdit(false)
      setEditMsg('')
    } catch (err) {
      setEditMsg(err.response?.data?.msg || 'Save failed')
    }
  }

  if (!project) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text3)' }}>Loading...</div>
  )

  return (
    <div >
      <button onClick={() => navigate('/projects')} style={{
        background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
        fontSize: 'clamp(12px, 2vw, 14px)', marginBottom: 'clamp(12px, 2vw, 20px)', display: 'flex', alignItems: 'center', gap: '6px', padding: 0, transition: 'color 0.2s'
      }}
        onMouseEnter={e => e.target.style.color = 'var(--accent2)'}
        onMouseLeave={e => e.target.style.color = 'var(--text2)'}
      >← Back</button>

      {isCompleted && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '12px', padding: '14px 18px', marginBottom: '16px'
        }}>
          <span style={{ fontSize: '20px' }}>🏁</span>
          <div>
            <p style={{ fontWeight: '700', fontSize: '14px', color: '#f59e0b', margin: 0 }}>Project Completed</p>
            <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '2px 0 0' }}>
              This project is no longer accepting new members or join requests.
            </p>
          </div>
        </div>
      )}

      {/* ── Main Card ── */}
      {!showEdit ? (
        <>
          <Card>
          <div className="project-detail-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(22px, 5vw, 26px)', fontWeight: '800', letterSpacing: '-0.5px', flex: 1, minWidth: '200px', wordBreak: 'break-word' }}>{project.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button onClick={toggleBookmark} style={{
                background: bookmarked ? 'rgba(245,158,11,0.15)' : 'transparent',
                color: bookmarked ? '#f59e0b' : 'var(--text3)',
                border: `1px solid ${bookmarked ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
                borderRadius: '8px', padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)', fontSize: 'clamp(12px, 2vw, 14px)',
                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}
                onMouseEnter={e => { e.target.style.background = 'rgba(245,158,11,0.2)' }}
                onMouseLeave={e => { e.target.style.background = bookmarked ? 'rgba(245,158,11,0.15)' : 'transparent' }}
              >{bookmarked ? '★ Saved' : '☆ Save'}</button>
              <span style={{
                fontSize: '11px', padding: '3px 8px', borderRadius: '20px', flexShrink: 0,
                background: project.status === 'open' ? 'rgba(34,211,165,0.1)' : project.status === 'in-progress' ? 'rgba(108,99,255,0.1)' : 'rgba(245,158,11,0.1)',
                color: project.status === 'open' ? 'var(--success)' : project.status === 'in-progress' ? 'var(--accent2)' : '#f59e0b',
                border: `1px solid ${project.status === 'open' ? 'rgba(34,211,165,0.2)' : project.status === 'in-progress' ? 'rgba(108,99,255,0.2)' : 'rgba(245,158,11,0.2)'}`, whiteSpace: 'nowrap'
              }}>{project.status}</span>
            </div>
          </div>

          <p style={{ color: 'var(--text2)', fontSize: 'clamp(13px, 2.5vw, 15px)', lineHeight: 1.6, marginBottom: '12px', wordBreak: 'break-word' }}>{project.description}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {project.tags?.slice(0, 4).map(tag => (
              <span key={tag} style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                background: `${tagColor(tag)}18`, color: tagColor(tag),
                border: `1px solid ${tagColor(tag)}40`, whiteSpace: 'nowrap'
              }}>{tag}</span>
            ))}
            {project.deadline && (
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.2)', whiteSpace: 'nowrap'
              }}>
                📅 {new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
              </span>
            )}
            {project.views > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--text3)', alignSelf: 'center' }}>👁 {project.views}</span>
            )}
          </div>

          {project.githubRepo && (
            <a href={project.githubRepo} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{
              fontSize: '12px', padding: '4px 10px', borderRadius: '20px',
              background: 'rgba(255,255,255,0.05)', color: 'var(--text2)',
              border: '1px solid var(--border)', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              transition: 'all 0.2s', marginBottom: '12px'
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent2)'; e.currentTarget.style.color = 'var(--accent2)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)' }}
            >
              <svg width='12' height='12' viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub Repo
            </a>
          )}

        {isOwner && (
          <div style={{ marginBottom: '18px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ padding: '8px 12px', borderRadius: '12px', background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.12)', color: 'var(--accent2)', fontWeight: '700' }}>
              {project.teamCoverage ? `${project.teamCoverage.pct ?? Math.round((project.teamCoverage || 0) * 100)}%` : '—'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text3)' }}>Team Coverage</div>
          </div>
        )}
          <p style={{ fontSize: 'clamp(11px, 2vw, 13px)', color: 'var(--text3)', marginBottom: '24px', wordBreak: 'break-word' }}>
            by {project.owner.name} · <span style={{ color: 'var(--accent2)', fontWeight: '600' }}>{project.members.length}</span>/{project.teamSize} members
          </p>

          {/* Required Skills */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: 'clamp(11px, 2vw, 13px)', color: 'var(--text2)', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Required Skills</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {project.requiredSkills.map((s, i) => <SkillTag key={i} name={s.name} proficiency={s.proficiency} />)}
            </div>
            {isOwner && project.teamCoverage?.details && (
              <div style={{ marginTop: '14px', display: 'grid', gap: '10px' }}>
                {project.teamCoverage.details.map((d, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ minWidth: '140px', fontSize: '13px', fontWeight: 600 }}>{d.name}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ height: '8px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${d.pct}%`, height: '100%', background: d.status === 'covered' ? 'var(--success)' : d.status === 'partial' ? '#f59e0b' : 'var(--danger)', transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: 'var(--text3)' }}>
                        <div>{d.status === 'covered' ? 'Covered' : d.status === 'partial' ? 'Partially covered' : 'Missing'}</div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div>{d.covered}/{d.required} · {d.pct}%</div>
                          {d.status === 'missing' && (
                            <button onClick={() => navigate(`/projects/${project._id}/matches?skill=${encodeURIComponent(d.name)}`)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--accent2)', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>Find teammates</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skill gap (for members) */}
          {isMember && !isOwner && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: 'clamp(11px, 2vw, 13px)', color: 'var(--text2)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Skill Match</p>
              {getSkillGap().map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)', marginBottom: '10px' }}>
                  <div style={{ width: '20px', fontSize: '14px', flexShrink: 0 }}>
                    {s.status === 'good' ? '✅' : s.status === 'low' ? '⚠️' : '❌'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: 'clamp(12px, 2vw, 13px)', fontWeight: '500' }}>{s.name}</span>
                      <span style={{ fontSize: 'clamp(11px, 1.5vw, 12px)', color: 'var(--text3)', flexShrink: 0 }}>
                        {s.status === 'missing' ? 'Missing' : `${s.has}/${s.required}`}
                      </span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
                      <div style={{
                        height: '100%', borderRadius: '2px', width: `${(s.has / 5) * 100}%`,
                        background: s.status === 'good' ? 'var(--success)' : s.status === 'low' ? '#f59e0b' : 'var(--danger)',
                        transition: 'width 0.5s'
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Team */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: 'clamp(11px, 2vw, 13px)', color: 'var(--text2)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team ({project.members.length})</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(150px, 100%, 180px), 1fr))', gap: '10px' }}>
              {project.members.map(m => (
                <div key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'var(--navy3)', borderRadius: '8px', border: '1px solid var(--border)', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: m.profilePic ? 'transparent' : 'var(--accent2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px', fontFamily: 'Syne, sans-serif', flexShrink: 0, overflow: 'hidden' }}>
                      {m.profilePic
                        ? <img src={m.profilePic} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : m.name[0].toUpperCase()
                      }
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p onClick={() => navigate(`/users/${m._id}`)} style={{ fontWeight: '600', fontSize: 'clamp(11px, 2vw, 13px)', cursor: 'pointer', color: 'var(--accent2)', wordBreak: 'break-word' }}>{m.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text3)' }}>{m.role?.substring(0, 12)}</p>
                    </div>
                  </div>
                  {isOwner && m._id !== user._id && (
                    <button onClick={() => removeMember(m._id)} style={{
                      background: 'rgba(255,94,108,0.08)', color: 'var(--danger)',
                      border: '1px solid rgba(255,94,108,0.2)', borderRadius: '5px',
                      padding: '3px 8px', fontSize: '11px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap'
                    }}>Remove</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Rate teammates */}
          {isCompleted && isMember && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: 'clamp(11px, 2vw, 13px)', color: 'var(--text2)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rate Teammates</p>
              {ratingMsg && (
                <div style={{ background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.2)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', color: 'var(--success)', fontSize: '13px' }}>
                  {ratingMsg}
                </div>
              )}
              {project.members.filter(m => m._id !== user._id).map(m => (
                <div key={m._id} style={{ background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: m.profilePic ? 'transparent' : 'var(--accent2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px', flexShrink: 0, overflow: 'hidden' }}>
                      {m.profilePic
                        ? <img src={m.profilePic} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : m.name[0].toUpperCase()
                      }
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '13px' }}>{m.name}</span>
                    {rated[m._id] && <span style={{ fontSize: '11px', color: 'var(--success)', marginLeft: 'auto' }}>✓ Rated</span>}
                  </div>
                  {!rated[m._id] && (
                    <>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                        {[1,2,3,4,5].map(star => (
                          <button key={star} onClick={() => setRatings(prev => ({ ...prev, [m._id]: { ...prev[m._id], score: star } }))}
                            style={{
                              width: '28px', height: '28px', borderRadius: '5px', border: 'none',
                              background: ratings[m._id]?.score >= star ? 'rgba(245,158,11,0.2)' : 'var(--border)',
                              color: ratings[m._id]?.score >= star ? '#f59e0b' : 'var(--text3)',
                              fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s'
                            }}>★</button>
                        ))}
                        <span style={{ fontSize: '12px', color: 'var(--text2)', marginLeft: '6px', alignSelf: 'center' }}>
                          {ratings[m._id]?.score ? `${ratings[m._id].score}/5` : 'Select'}
                        </span>
                      </div>
                      <textarea placeholder="Comment..." value={ratings[m._id]?.comment || ''}
                        onChange={e => setRatings(prev => ({ ...prev, [m._id]: { ...prev[m._id], comment: e.target.value } }))}
                        style={{ width: '100%', background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: 'var(--text)', fontSize: '12px', resize: 'none', outline: 'none', fontFamily: 'DM Sans, sans-serif', marginBottom: '8px', minHeight: '50px', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                      <button onClick={() => submitRating(m._id)} className="btn btn-primary" style={{ fontSize: '13px', padding: '7px 18px' }}>Submit</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Owner: Project status controls */}
          {isOwner && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: 'clamp(11px, 2vw, 13px)', color: 'var(--text2)', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project Status</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {['open', 'in-progress', 'completed'].map(s => (
                  <button key={s} onClick={() => changeStatus(s)} style={{
                    padding: '6px clamp(10px, 2vw, 16px)', borderRadius: '6px', fontSize: 'clamp(11px, 2vw, 13px)',
                    fontWeight: '600', cursor: project.status === s ? 'default' : 'pointer',
                    border: project.status === s ? 'none' : '1px solid var(--border)',
                    background: project.status === s
                      ? s === 'open' ? 'rgba(34,211,165,0.15)' : s === 'in-progress' ? 'rgba(108,99,255,0.15)' : 'rgba(245,158,11,0.15)'
                      : 'transparent',
                    color: project.status === s
                      ? s === 'open' ? 'var(--success)' : s === 'in-progress' ? 'var(--accent2)' : '#f59e0b'
                      : 'var(--text3)',
                    transition: 'all 0.2s', whiteSpace: 'nowrap'
                  }}>
                    {s === 'open' ? '🟢 Open' : s === 'in-progress' ? '🔵 In Progress' : '🟡 Completed'}
                  </button>
                ))}
              </div>
              {statusMsg && <p style={{ fontSize: '12px', color: 'var(--success)' }}>{statusMsg}</p>}
            </div>
          )}

          {/* Feedback message */}
          {msg && (
            <div style={{
              background: msg.toLowerCase().includes('error') || msg.toLowerCase().includes('err') ? 'rgba(255,94,108,0.1)' : 'rgba(34,211,165,0.1)',
              border: `1px solid ${msg.toLowerCase().includes('error') || msg.toLowerCase().includes('err') ? 'rgba(255,94,108,0.2)' : 'rgba(34,211,165,0.2)'}`,
              borderRadius: '8px', padding: '10px 12px', marginBottom: '16px',
              color: msg.toLowerCase().includes('error') || msg.toLowerCase().includes('err') ? 'var(--danger)' : 'var(--success)',
              fontSize: 'clamp(12px, 2vw, 14px)'
            }}>{msg}</div>
          )}

          {/* Action buttons grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(120px, 100%, 160px), 1fr))', gap: 'clamp(8px, 2vw, 12px)' }}>
            {isOwner && (
              <>
                <button onClick={() => setShowEdit(true)} className="btn btn-secondary">✏️ Edit</button>
                <button onClick={() => navigate(`/projects/${id}/matches`)} style={{
                  background: 'var(--accent3)', color: 'white', border: 'none',
                  borderRadius: '8px', padding: 'clamp(8px, 2vw, 11px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)',
                  fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif', transition: 'all 0.2s'
                }}
                  onMouseEnter={e => e.target.style.background = 'var(--accent2)'}
                  onMouseLeave={e => e.target.style.background = 'var(--accent3)'}
                >View Matches</button>
                <button onClick={() => navigate(`/projects/${id}/roadmap`)} style={{
                  background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(34,211,165,0.15))',
                  color: 'var(--accent2)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '8px',
                  padding: 'clamp(8px, 2vw, 11px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                }}
                  onMouseEnter={e => e.target.style.borderColor = 'var(--accent2)'}
                  onMouseLeave={e => e.target.style.borderColor = 'rgba(108,99,255,0.3)'}
                >📋 Roadmap</button>
                <button onClick={() => navigate(`/projects/${id}/analytics`)} style={{
                  background: 'rgba(108,99,255,0.12)', color: 'var(--accent2)',
                  border: '1px solid rgba(108,99,255,0.25)', borderRadius: '8px',
                  padding: 'clamp(8px, 2vw, 11px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                }}
                  onMouseEnter={e => e.target.style.borderColor = 'var(--accent2)'}
                  onMouseLeave={e => e.target.style.borderColor = 'rgba(108,99,255,0.25)'}
                >📊 Analytics</button>
                <button onClick={deleteProject} style={{
                  background: 'rgba(255,94,108,0.08)', color: 'var(--danger)',
                  border: '1px solid rgba(255,94,108,0.2)', borderRadius: '8px',
                  padding: 'clamp(8px, 2vw, 11px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                }}
                  onMouseEnter={e => { e.target.style.background = 'rgba(255,94,108,0.15)'; e.target.style.borderColor = 'rgba(255,94,108,0.4)' }}
                  onMouseLeave={e => { e.target.style.background = 'rgba(255,94,108,0.08)'; e.target.style.borderColor = 'rgba(255,94,108,0.2)' }}
                >Delete</button>
              </>
            )}

            {(isOwner || isMember) && (
              <button onClick={() => setIsChatOpen(true)} style={{
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                color: 'white', border: 'none',
                borderRadius: '8px', padding: 'clamp(8px, 2vw, 11px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)',
                fontWeight: '700', cursor: 'pointer', fontFamily: 'Syne, sans-serif', boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                transition: 'all 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >💬 Team Chat</button>
            )}

            {/* Non-owner, not a member — show join/re-apply/pending states */}
            {!isOwner && !isMember && !isCompleted && (
              <>
                {requestStatus === 'none' && (
                  <button onClick={sendRequest} style={{
                    background: 'var(--accent3)', color: 'white', border: 'none',
                    borderRadius: '8px', padding: 'clamp(8px, 2vw, 11px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)',
                    fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif', transition: 'all 0.2s'
                  }}
                    onMouseEnter={e => e.target.style.background = 'var(--accent2)'}
                    onMouseLeave={e => e.target.style.background = 'var(--accent3)'}
                  >Join Project</button>
                )}
                {requestStatus === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button disabled style={{
                      background: 'rgba(108,99,255,0.08)', color: 'var(--text3)',
                      border: '1px solid rgba(108,99,255,0.2)', borderRadius: '8px',
                      padding: 'clamp(8px, 2vw, 11px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)',
                      fontWeight: '600', cursor: 'not-allowed', opacity: 0.75
                    }}>⏳ Request Pending</button>
                    <button onClick={withdrawRequest} style={{
                      background: 'rgba(255,94,108,0.08)', color: 'var(--danger)',
                      border: '1px solid rgba(255,94,108,0.2)', borderRadius: '8px',
                      padding: 'clamp(8px, 2vw, 11px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)',
                      fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                      onMouseEnter={e => { e.target.style.background = 'rgba(255,94,108,0.15)'; e.target.style.borderColor = 'rgba(255,94,108,0.4)' }}
                      onMouseLeave={e => { e.target.style.background = 'rgba(255,94,108,0.08)'; e.target.style.borderColor = 'rgba(255,94,108,0.2)' }}
                    >✕ Withdraw</button>
                  </div>
                )}
                {requestStatus === 'rejected' && (
                  <button onClick={sendRequest} style={{
                    background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                    border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px',
                    padding: 'clamp(8px, 2vw, 11px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)',
                    fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                    onMouseEnter={e => e.target.style.background = 'rgba(245,158,11,0.18)'}
                    onMouseLeave={e => e.target.style.background = 'rgba(245,158,11,0.1)'}
                  >↩ Re-apply</button>
                )}
              </>
            )}

            {/* Non-owner member — roadmap + leave */}
            {isMember && !isOwner && (
              <>
                <button onClick={() => navigate(`/projects/${id}/roadmap`)} style={{
                  background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(34,211,165,0.15))',
                  color: 'var(--accent2)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '8px',
                  padding: 'clamp(8px, 2vw, 11px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                }}
                  onMouseEnter={e => e.target.style.borderColor = 'var(--accent2)'}
                  onMouseLeave={e => e.target.style.borderColor = 'rgba(108,99,255,0.3)'}
                >📋 Roadmap</button>
                {!isCompleted && (
                  <button onClick={leaveProject} style={{
                    background: 'rgba(255,94,108,0.08)', color: 'var(--danger)',
                    border: '1px solid rgba(255,94,108,0.2)', borderRadius: '8px',
                    padding: 'clamp(8px, 2vw, 11px) clamp(12px, 3vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)',
                    fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                    onMouseEnter={e => { e.target.style.background = 'rgba(255,94,108,0.15)'; e.target.style.borderColor = 'rgba(255,94,108,0.4)' }}
                    onMouseLeave={e => { e.target.style.background = 'rgba(255,94,108,0.08)'; e.target.style.borderColor = 'rgba(255,94,108,0.2)' }}
                  >Leave Project</button>
                )}
              </>
            )}
          </div>
        </Card>

        <ResourceHub
          projectId={id}
          resources={project.resources || []}
          canManage={isOwner || isMember}
          onUpdate={(newResources) => setProject(prev => ({ ...prev, resources: newResources }))}
        />
        </>
      ) : (
        /* ── Edit Project Inline Form ── */
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Edit Project</h2>
            <button onClick={() => setShowEdit(false)} style={{
              background: 'none', border: '1px solid var(--border)', color: 'var(--text2)',
              borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer'
            }}>Cancel</button>
          </div>

          {editForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>Project Title</label>
                  <input style={inputStyle} value={editForm.title}
                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--glass-border)'} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>Team Size</label>
                  <input style={inputStyle} type="number" min="2" max="20"
                    value={editForm.teamSize}
                    onChange={e => setEditForm(f => ({ ...f, teamSize: Number(e.target.value) }))}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--glass-border)'} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>Deadline</label>
                  <input style={{ ...inputStyle, colorScheme: 'dark' }} type="date"
                    value={editForm.deadline}
                    onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--glass-border)'} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>Description</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '90px' }}
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--glass-border)'} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>GitHub Repository (optional)</label>
                <input style={inputStyle} placeholder="https://github.com/username/repo"
                  value={editForm.githubRepo}
                  onChange={e => setEditForm(f => ({ ...f, githubRepo: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--glass-border)'} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px', display: 'block' }}>Tags</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {TAGS.map(tag => (
                    <button key={tag} type="button" onClick={() => toggleEditTag(tag)} style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s',
                      background: editForm.tags.includes(tag) ? `${tagColor(tag)}22` : 'transparent',
                      color: editForm.tags.includes(tag) ? tagColor(tag) : 'var(--text3)',
                      border: `1px solid ${editForm.tags.includes(tag) ? tagColor(tag) : 'var(--border)'}`
                    }}>{tag}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px', display: 'block' }}>Required Skills</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px', minHeight: '28px' }}>
                  {editForm.requiredSkills.map((s, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)', color: 'var(--accent2)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '500', gap: '4px' }}>
                      {s.name} <span style={{ color: 'var(--text3)', fontSize: '10px' }}>{s.proficiency}/5</span>
                      <button type="button" onClick={() => removeEditSkill(i)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '13px', lineHeight: 1, padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <input style={{ ...inputStyle, flex: 1, minWidth: '140px' }} placeholder="Skill name"
                    value={newSkill.name} onChange={e => setNewSkill(s => ({ ...s, name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEditSkill())}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--glass-border)'} />
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {profLevels.map(({ level, label, color }) => (
                      <button key={level} type="button" onClick={() => setNewSkill(s => ({ ...s, proficiency: level }))} style={{
                        width: '26px', height: '36px', borderRadius: '6px', border: 'none',
                        fontSize: '10px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
                        background: newSkill.proficiency >= level ? color : 'var(--border)',
                        color: newSkill.proficiency >= level ? 'white' : 'var(--text3)'
                      }}>{label}</button>
                    ))}
                  </div>
                  <button type="button" onClick={addEditSkill} className="btn btn-secondary" style={{ padding: '0 14px', fontSize: '12px' }}>Add</button>
                </div>
              </div>

              {editMsg && <p style={{ color: 'var(--danger)', fontSize: '13px' }}>{editMsg}</p>}

              <button onClick={saveEdit} className="btn btn-primary">Save Changes</button>
            </div>
          )}
        </Card>
      )}

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        mode="project"
        projectId={id}
        projectTitle={project?.title || ''}
      />
    </div>
  )
}
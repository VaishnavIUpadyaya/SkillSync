import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Card from '../components/Card'
import SkillTag from '../components/SkillTag'

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [requested, setRequested] = useState(false)
  const [msg, setMsg] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [ratings, setRatings] = useState({})
  const [rated, setRated] = useState({})
  const [ratingMsg, setRatingMsg] = useState('')
  const [bookmarked, setBookmarked] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/projects/${id}`).then(r => {
      setProject(r.data)
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
  }, [id, user])

  const isOwner = project?.owner._id === user?._id
  const isMember = project?.members.some(m => m._id === user?._id)

  const toggleBookmark = async () => {
    const res = await api.post(`/users/bookmarks/${id}`)
    setBookmarked(res.data.bookmarked)
  }

  const sendRequest = async () => {
    try {
      await api.post('/requests', { projectId: id })
      setRequested(true)
      setMsg('Request sent successfully!')
    } catch (err) { setMsg(err.response?.data?.msg || 'Error') }
  }

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return
    await api.delete(`/projects/${id}/members/${userId}`)
    setProject({ ...project, members: project.members.filter(m => m._id !== userId) })
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
      await api.post('/ratings', {
        rateeId, projectId: id,
        score: r.score, comment: r.comment || ''
      })
      setRated(prev => ({ ...prev, [rateeId]: true }))
      setRatingMsg('Rating submitted!')
      setTimeout(() => setRatingMsg(''), 2000)
    } catch (err) {
      setRatingMsg(err.response?.data?.msg || 'Error')
    }
  }

  if (!project) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text3)' }}>Loading...</div>
  )

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      <button onClick={() => navigate('/projects')} style={{
        background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
        fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0
      }}>← Back to Projects</button>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>{project.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={toggleBookmark} style={{
              background: bookmarked ? 'rgba(245,158,11,0.15)' : 'transparent',
              color: bookmarked ? '#f59e0b' : 'var(--text3)',
              border: `1px solid ${bookmarked ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
              borderRadius: '8px', padding: '6px 12px', fontSize: '14px',
              cursor: 'pointer', transition: 'all 0.2s'
            }}>{bookmarked ? '★ Saved' : '☆ Save'}</button>
            <span style={{
              fontSize: '12px', padding: '4px 12px', borderRadius: '20px', flexShrink: 0,
              background: project.status === 'open' ? 'rgba(34,211,165,0.1)' : project.status === 'in-progress' ? 'rgba(108,99,255,0.1)' : 'rgba(245,158,11,0.1)',
              color: project.status === 'open' ? 'var(--success)' : project.status === 'in-progress' ? 'var(--accent2)' : '#f59e0b',
              border: `1px solid ${project.status === 'open' ? 'rgba(34,211,165,0.2)' : project.status === 'in-progress' ? 'rgba(108,99,255,0.2)' : 'rgba(245,158,11,0.2)'}`
            }}>{project.status}</span>
          </div>
        </div>

        <p style={{ color: 'var(--text2)', fontSize: '15px', lineHeight: 1.6, marginBottom: '8px' }}>{project.description}</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {project.tags?.map(tag => (
            <span key={tag} style={{
              fontSize: '12px', padding: '3px 10px', borderRadius: '20px',
              background: 'rgba(108,99,255,0.12)', color: 'var(--accent2)',
              border: '1px solid rgba(108,99,255,0.25)'
            }}>{tag}</span>
          ))}
          {project.deadline && (
            <span style={{
              fontSize: '12px', padding: '3px 10px', borderRadius: '20px',
              background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.2)'
            }}>
              📅 Due {new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {project.views > 0 && (
            <span style={{ fontSize: '12px', color: 'var(--text3)', alignSelf: 'center' }}>👁 {project.views} views</span>
          )}
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '24px' }}>by {project.owner.name} · {project.members.length}/{project.teamSize} members</p>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Required Skills</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {project.requiredSkills.map((s, i) => <SkillTag key={i} name={s.name} proficiency={s.proficiency} />)}
          </div>
        </div>

        {isMember && !isOwner && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Skill Match</p>
            {getSkillGap().map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <div style={{ width: '20px', fontSize: '14px' }}>
                  {s.status === 'good' ? '✅' : s.status === 'low' ? '⚠️' : '❌'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>{s.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                      {s.status === 'missing' ? 'Not in your profile' : `Your level: ${s.has}/5 · Required: ${s.required}/5`}
                    </span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
                    <div style={{
                      height: '100%', borderRadius: '2px',
                      width: `${(s.has / 5) * 100}%`,
                      background: s.status === 'good' ? 'var(--success)' : s.status === 'low' ? '#f59e0b' : 'var(--danger)',
                      transition: 'width 0.5s'
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Members</p>
          {project.members.map(m => (
            <div key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', fontFamily: 'Syne, sans-serif', flexShrink: 0 }}>
                  {m.name[0].toUpperCase()}
                </div>
                <div>
                  <p onClick={() => navigate(`/users/${m._id}`)} style={{ fontWeight: '600', fontSize: '14px', cursor: 'pointer', color: 'var(--accent2)' }}>{m.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
                    {m.role}
                    {(isOwner || isMember) && m.email && <span style={{ marginLeft: '8px' }}>{m.email}</span>}
                  </p>
                </div>
              </div>
              {isOwner && m._id !== user._id && (
                <button onClick={() => removeMember(m._id)} style={{
                  background: 'rgba(255,94,108,0.08)', color: 'var(--danger)',
                  border: '1px solid rgba(255,94,108,0.2)', borderRadius: '6px',
                  padding: '4px 12px', fontSize: '12px', cursor: 'pointer'
                }}>Remove</button>
              )}
            </div>
          ))}
        </div>

        {project.status === 'completed' && isMember && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rate Your Teammates</p>
            {ratingMsg && (
              <div style={{ background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', color: 'var(--success)', fontSize: '13px' }}>
                {ratingMsg}
              </div>
            )}
            {project.members.filter(m => m._id !== user._id).map(m => (
              <div key={m._id} style={{ background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', fontFamily: 'Syne, sans-serif' }}>
                    {m.name[0].toUpperCase()}
                  </div>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{m.name}</span>
                  {rated[m._id] && <span style={{ fontSize: '12px', color: 'var(--success)', marginLeft: 'auto' }}>✓ Rated</span>}
                </div>
                {!rated[m._id] && (
                  <>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                      {[1,2,3,4,5].map(star => (
                        <button key={star}
                          onClick={() => setRatings(prev => ({ ...prev, [m._id]: { ...prev[m._id], score: star } }))}
                          style={{
                            width: '32px', height: '32px', borderRadius: '6px', border: 'none',
                            background: ratings[m._id]?.score >= star ? 'rgba(245,158,11,0.2)' : 'var(--border)',
                            color: ratings[m._id]?.score >= star ? '#f59e0b' : 'var(--text3)',
                            fontSize: '16px', cursor: 'pointer', transition: 'all 0.15s'
                          }}>★</button>
                      ))}
                      <span style={{ fontSize: '13px', color: 'var(--text2)', marginLeft: '8px', alignSelf: 'center' }}>
                        {ratings[m._id]?.score ? `${ratings[m._id].score}/5` : 'Select'}
                      </span>
                    </div>
                    <textarea
                      placeholder="Add a comment (optional)..."
                      value={ratings[m._id]?.comment || ''}
                      onChange={e => setRatings(prev => ({ ...prev, [m._id]: { ...prev[m._id], comment: e.target.value } }))}
                      style={{
                        width: '100%', background: 'var(--navy2)', border: '1px solid var(--border)',
                        borderRadius: '8px', padding: '8px 12px', color: 'var(--text)',
                        fontSize: '13px', resize: 'none', outline: 'none',
                        fontFamily: 'DM Sans, sans-serif', marginBottom: '10px', minHeight: '60px',
                        boxSizing: 'border-box'
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    <button onClick={() => submitRating(m._id)} style={{
                      background: 'var(--accent)', color: 'white', border: 'none',
                      borderRadius: '8px', padding: '8px 18px', fontSize: '13px',
                      fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif'
                    }}>Submit Rating</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {isOwner && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project Status</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['open', 'in-progress', 'completed'].map(s => (
                <button key={s} onClick={() => changeStatus(s)} style={{
                  padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                  fontWeight: '600', cursor: project.status === s ? 'default' : 'pointer',
                  border: project.status === s ? 'none' : '1px solid var(--border)',
                  background: project.status === s
                    ? s === 'open' ? 'rgba(34,211,165,0.15)'
                    : s === 'in-progress' ? 'rgba(108,99,255,0.15)'
                    : 'rgba(245,158,11,0.15)'
                    : 'transparent',
                  color: project.status === s
                    ? s === 'open' ? 'var(--success)'
                    : s === 'in-progress' ? 'var(--accent2)'
                    : '#f59e0b'
                    : 'var(--text3)',
                  transition: 'all 0.2s'
                }}>
                  {s === 'open' ? '🟢 Open' : s === 'in-progress' ? '🔵 In Progress' : '🟡 Completed'}
                </button>
              ))}
            </div>
            {statusMsg && <p style={{ fontSize: '13px', color: 'var(--success)', marginTop: '8px' }}>{statusMsg}</p>}
          </div>
        )}

        {msg && (
          <div style={{ background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: 'var(--success)', fontSize: '14px' }}>
            {msg}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {isOwner && (
            <>
              <button onClick={() => navigate(`/projects/${id}/matches`)} style={{
                background: 'var(--accent2)', color: 'white', border: 'none',
                borderRadius: '10px', padding: '11px 20px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif'
              }}>View Matches</button>
              <button onClick={() => navigate(`/projects/${id}/analytics`)} style={{
                background: 'rgba(108,99,255,0.12)', color: 'var(--accent2)',
                border: '1px solid rgba(108,99,255,0.25)', borderRadius: '10px',
                padding: '11px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
              }}>Analytics</button>
              <button onClick={deleteProject} style={{
                background: 'rgba(255,94,108,0.08)', color: 'var(--danger)',
                border: '1px solid rgba(255,94,108,0.2)', borderRadius: '10px',
                padding: '11px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
              }}>Delete Project</button>
            </>
          )}
          {!isOwner && !isMember && !requested && (
            <button onClick={sendRequest} style={{
              background: 'var(--accent)', color: 'white', border: 'none',
              borderRadius: '10px', padding: '11px 20px', fontSize: '14px',
              fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif'
            }}>Request to Join</button>
          )}
          {(requested || isMember) && !isOwner && (
            <span style={{ color: 'var(--success)', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
              {isMember ? 'You are a member' : 'Request sent!'}
            </span>
          )}
        </div>
      </Card>
    </div>
  )
}
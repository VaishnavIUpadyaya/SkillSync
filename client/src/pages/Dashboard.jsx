import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [invites, setInvites] = useState([])
  const [activities, setActivities] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        const [reqRes, invRes, actRes, recRes] = await Promise.all([
          api.get('/requests/mine'),
          api.get('/requests/invites'),
          api.get('/activities'),
          api.get('/projects/recommendations')
        ])

        setRequests(reqRes.data)
        setInvites(invRes.data)
        setActivities(actRes.data)
        setRecommendations(recRes.data)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  useEffect(() => {
    const handleToggleNotifications = () => setShowNotifications(prev => !prev)
    window.addEventListener('toggle-notifications', handleToggleNotifications)
    return () => window.removeEventListener('toggle-notifications', handleToggleNotifications)
  }, [])

  const handleRequest = async (id, status) => {
    const previous = requests
    setRequests(prev => prev.filter(r => r._id !== id))
    try {
      await api.put(`/requests/${id}`, { status })
      toast.success(status === 'accepted' ? 'Request accepted! 🎉' : 'Request rejected.')
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error')
      setRequests(previous)
    }
  }

  const handleInvite = async (id, status) => {
    const previous = invites
    setInvites(prev => prev.filter(i => i._id !== id))
    try {
      await api.put(`/requests/${id}`, { status })
      toast.success(status === 'accepted' ? 'Invite accepted! Welcome to the team 🎉' : 'Invite declined.')
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Error')
      setInvites(previous)
    }
  }

  const getActivityText = (act) => {
    const userName = act.user?._id === user?._id ? 'You' : act.user?.name || 'Someone'
    switch (act.type) {
      case 'PROJECT_COMPLETED':
        return <span><strong>{userName}</strong> completed <strong>{act.project?.title}</strong></span>
      case 'ENDORSEMENT':
        return <span><strong>{userName}</strong> got endorsed for <strong>{act.skill}</strong> by {act.count} {act.count === 1 ? 'person' : 'people'}</span>
      case 'TEAM_FULL':
        return <span>Team for <strong>{act.project?.title}</strong> just hit full capacity! 🚀</span>
      case 'NEW_PROJECT':
        return <span>New project matching your community interests: <strong>{act.project?.title}</strong></span>
      default:
        return 'Something happened'
    }
  }

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  if (loading) return (
    <div className="page-container dashboard-shell" style={{ display: 'flex', flexDirection: 'column', gap: '24px', opacity: 0.7 }}>
      <div className="glass-card" style={{ padding: '28px', height: '180px', borderRadius: '16px', background: 'var(--glass)' }}>
        <div style={{ width: '40%', height: '24px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', marginBottom: '16px' }} />
        <div style={{ width: '80%', height: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', marginBottom: '12px' }} />
        <div style={{ width: '60%', height: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }} />
      </div>
      <div className="glass-card" style={{ padding: '28px', height: '240px', borderRadius: '16px', background: 'var(--glass)' }}>
        <div style={{ width: '30%', height: '24px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', marginBottom: '16px' }} />
        <div style={{ width: '90%', height: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', marginBottom: '12px' }} />
        <div style={{ width: '75%', height: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }} />
      </div>
    </div>
  )

  return (
    <div
      className="page-container dashboard-shell"
    >
      <div style={{ position: 'absolute', right: '0px', top: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle at center, rgba(79,155,73,0.08), transparent 60%)', filter: 'blur(56px)', pointerEvents: 'none', zIndex: -3 }} />
      <div style={{ position: 'absolute', left: '-40px', bottom: '10px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle at center, rgba(138,138,46,0.06), transparent 55%)', filter: 'blur(52px)', pointerEvents: 'none', zIndex: -3 }} />

      <div className="dashboard-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px' }}>
        <div className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ── Pending Requests & Invites ── */}
          {(requests.length > 0 || invites.length > 0) && (
            <section
              className="glass-card"
              style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#f59e0b', letterSpacing: '1.2px', fontWeight: '700', textTransform: 'uppercase' }}>Action required</span>
                <h2 style={{ margin: '10px 0 4px', fontSize: '22px', fontWeight: '800' }}>Pending Requests &amp; Invites</h2>
                <p style={{ margin: 0, color: 'var(--text3)', fontSize: '13px' }}>Review and respond to join requests for your projects and invites sent to you.</p>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {requests.map((req) => (
                  <div key={req._id}
                    style={{
                      padding: '16px 18px', borderRadius: '14px',
                      border: '1px solid rgba(245,158,11,0.22)',
                      background: 'rgba(245,158,11,0.06)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>
                        🙋 {req.sender?.name || 'Someone'} wants to join <span style={{ color: 'var(--accent2)' }}>{req.project?.title || 'your project'}</span>
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text3)' }}>{req.sender?.email || ''}</p>
                    </div>
                    <div className="request-action-row" style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => handleRequest(req._id, 'accepted')} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>✓ Accept</button>
                      <button onClick={() => handleRequest(req._id, 'rejected')} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>✕ Reject</button>
                    </div>
                  </div>
                ))}

                {invites.map((invite) => (
                  <div key={invite._id}
                    style={{
                      padding: '16px 18px', borderRadius: '14px',
                      border: '1px solid rgba(108,99,255,0.22)',
                      background: 'rgba(108,99,255,0.06)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>
                        ✉️ {invite.sender?.name || 'Someone'} invited you to <span style={{ color: 'var(--accent2)' }}>{invite.project?.title || 'a project'}</span>
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text3)' }}>{invite.project?.description?.slice(0, 80) || 'Open the project to review details.'}</p>
                    </div>
                    <div className="request-action-row" style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => handleInvite(invite._id, 'accepted')} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>✓ Accept</button>
                      <button onClick={() => handleInvite(invite._id, 'rejected')} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>✕ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section
            className="glass-card"
            style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}
          >
            <div className="dashboard-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--accent2)', letterSpacing: '1.2px', fontWeight: '700', textTransform: 'uppercase' }}>Skill recommendations</span>
                <h1 style={{ margin: '10px 0 0', fontSize: '24px', fontWeight: '800' }}>Projects matching your skills</h1>
                <p style={{ margin: '8px 0 0', color: 'var(--text3)', maxWidth: '680px' }}>These open projects scored above 60% against your skill profile using the same matching logic that powers SkillSync recommendations.</p>
              </div>
              <button onClick={() => navigate('/projects')} className="btn btn-secondary" style={{ fontSize: '12px', padding: '10px 16px' }}>Browse projects</button>
            </div>

            {recommendations.length === 0 ? (
              <div className="dashboard-activity-item" style={{ textAlign: 'center' }}>
                No recommendations yet — add more skills to your profile to unlock stronger matches.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {recommendations.map((project, idx) => (
                  <div key={project._id || idx} className="dashboard-activity-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>{project.title}</p>
                        <p style={{ margin: '8px 0 0', fontSize: '13px', lineHeight: '1.6', color: 'var(--text3)' }}>{project.description}</p>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '72px' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent2)' }}>{Math.round(project.score * 100)}%</div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.9px', marginTop: '2px' }}>match</div>
                      </div>
                    </div>
                    {project.matchedSkills?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                        {project.matchedSkills.slice(0, 3).map((skill) => (
                          <span key={skill} style={{ padding: '6px 10px', borderRadius: '999px', background: 'rgba(79, 155, 73, 0.14)', color: 'var(--accent2)', fontSize: '12px', fontWeight: '600' }}>{skill}</span>
                        ))}
                      </div>
                    )}
                    <button onClick={() => navigate(`/projects/${project._id}`)} className="btn btn-secondary" style={{ marginTop: '14px', width: '100%', borderRadius: '12px', padding: '10px', fontSize: '13px' }}>View project</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section
            className="glass-card"
            style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}
          >
            <div className="dashboard-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--accent2)', letterSpacing: '1.2px', fontWeight: '700', textTransform: 'uppercase' }}>Activity logger</span>
                <h1 style={{ margin: '10px 0 0', fontSize: '24px', fontWeight: '800' }}>Latest updates</h1>
                <p style={{ margin: '8px 0 0', color: 'var(--text3)', maxWidth: '680px' }}>Keep track of endorsements, project completions, and team updates from one place.</p>
              </div>
              <button onClick={() => navigate('/projects')} className="btn btn-secondary" style={{ fontSize: '12px', padding: '10px 16px' }}>Browse projects</button>
            </div>

            <div style={{ display: 'grid', gap: '14px' }}>
              {activities.length === 0 ? (
                <div className="dashboard-activity-item" style={{ textAlign: 'center' }}>
                  Nothing new yet — your activity log will appear here.
                </div>
              ) : activities.slice(0, 8).map((act, idx) => (
                <div key={act._id || idx} className="dashboard-activity-item">
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ minWidth: '42px', minHeight: '42px', borderRadius: '14px', background: 'rgba(79,155,73,0.12)', display: 'grid', placeItems: 'center', fontSize: '18px' }}>
                      {act.type === 'PROJECT_COMPLETED' ? '🏆' : act.type === 'ENDORSEMENT' ? '✨' : act.type === 'TEAM_FULL' ? '🔥' : '📢'}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: 'var(--text)' }}>{getActivityText(act)}</p>
                      <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'var(--text3)' }}>{getTimeAgo(act.createdAt)}</p>
                    </div>
                  </div>
                  {act.project && (
                    <button onClick={() => navigate(`/projects/${act.project._id}`)} className="btn btn-secondary" style={{ marginTop: '16px', width: '100%', borderRadius: '12px', padding: '10px', fontSize: '13px' }}>Open project</button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

        {showNotifications && (
          <>
            <div
              onClick={() => setShowNotifications(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(4, 8, 20, 0.58)', zIndex: 30 }}
            />
            <aside
              style={{ position: 'fixed', top: 0, right: 0, width: '360px', maxWidth: '92vw', height: '100vh', background: 'var(--navy)', borderLeft: '1px solid var(--border)', zIndex: 31, overflowY: 'auto', padding: '24px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--accent2)', letterSpacing: '1.2px', fontWeight: '700', textTransform: 'uppercase' }}>Notifications</span>
                  <h2 style={{ margin: '8px 0 0', fontSize: '22px', fontWeight: '800' }}>Pending actions</h2>
                </div>
                <button onClick={() => setShowNotifications(false)} className="btn btn-secondary" style={{ padding: '8px 10px' }}>✕</button>
              </div>

              <div style={{ display: 'grid', gap: '14px' }}>
                {requests.length === 0 && invites.length === 0 ? (
                  <div className="dashboard-activity-item" style={{ textAlign: 'center' }}>
                    No pending invites or join requests right now.
                  </div>
                ) : null}

                {requests.map((req) => (
                  <div key={req._id} style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--navy3)' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>
                      {req.sender?.name || 'Someone'} wants to join {req.project?.title || 'a project'}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text3)' }}>Join request from {req.sender?.email || 'a user'}</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button onClick={() => handleRequest(req._id, 'accepted')} className="btn btn-primary" style={{ padding: '8px 12px', fontSize: '13px' }}>Accept</button>
                      <button onClick={() => handleRequest(req._id, 'rejected')} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '13px' }}>Reject</button>
                    </div>
                  </div>
                ))}

                {invites.map((invite) => (
                  <div key={invite._id} style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--navy3)' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>
                      {invite.sender?.name || 'Someone'} invited you to {invite.project?.title || 'a project'}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text3)' }}>{invite.project?.description || 'Open the project to review the details.'}</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button onClick={() => handleInvite(invite._id, 'accepted')} className="btn btn-primary" style={{ padding: '8px 12px', fontSize: '13px' }}>Accept</button>
                      <button onClick={() => handleInvite(invite._id, 'rejected')} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '13px' }}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </>
        )}

    </div>
  )
}

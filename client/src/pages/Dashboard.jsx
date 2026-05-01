import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Card from '../components/Card'
import SkillTag from '../components/SkillTag'

export default function Dashboard() {
  const { user } = useAuth()
  const [myProjects, setMyProjects] = useState([])
  const [requests, setRequests] = useState([])
  const [invites, setInvites] = useState([])
  const [sentInvites, setSentInvites] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [activities, setActivities] = useState([])
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        const [projRes, reqRes, invRes, sentInvRes, bookRes, actRes] = await Promise.all([
          api.get('/projects'),
          api.get('/requests/mine'),
          api.get('/requests/invites'),
          api.get('/requests/invites/sent'),
          api.get('/users/bookmarks/all'),
          api.get('/activities')
        ])
        
        setMyProjects(projRes.data.filter(p => p.owner?._id === user?._id || p.owner === user?._id))
        setRequests(reqRes.data)
        setInvites(invRes.data)
        setSentInvites(sentInvRes.data)
        setBookmarks(bookRes.data)
        setActivities(actRes.data)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleRequest = async (id, status) => {
    setRequests(prev => prev.filter(r => r._id !== id))
    try {
      await api.put(`/requests/${id}`, { status })
    } catch (err) {
      alert(err.response?.data?.msg || 'Error')
      const r = await api.get('/requests/mine')
      setRequests(r.data)
    }
  }

  const handleInvite = async (id, status) => {
    setInvites(prev => prev.filter(i => i._id !== id))
    try {
      await api.put(`/requests/${id}`, { status })
    } catch (err) {
      alert(err.response?.data?.msg || 'Error')
      const r = await api.get('/requests/invites')
      setInvites(r.data)
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text3)' }}>Loading...</div>
  )

  const pendingCount = requests.length + invites.length

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', boxSizing: 'border-box', position: 'relative' }}>
      
      {/* Header with Menu Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text2)', marginTop: '4px', fontSize: '15px' }}>Here's what's happening in your network</p>
        </div>
        
        <button 
          onClick={() => setShowMenu(!showMenu)}
          style={{
            background: showMenu ? 'var(--accent)' : 'var(--navy3)',
            color: showMenu ? 'white' : 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative'
          }}
        >
          {pendingCount > 0 && !showMenu && (
            <span style={{
              position: 'absolute', top: '-5px', right: '-5px',
              background: 'var(--danger)', color: 'white',
              fontSize: '10px', padding: '2px 6px', borderRadius: '10px',
              fontWeight: '700', border: '2px solid var(--bg)'
            }}>{pendingCount}</span>
          )}
          <div style={{ width: '20px', height: '2px', background: 'currentColor', borderRadius: '2px' }} />
          <div style={{ width: '20px', height: '2px', background: 'currentColor', borderRadius: '2px' }} />
          <div style={{ width: '20px', height: '2px', background: 'currentColor', borderRadius: '2px' }} />
        </button>
      </div>

      {/* Slide-out Management Menu */}
      {showMenu && (
        <>
          <div 
            onClick={() => setShowMenu(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
              zIndex: 1999, animation: 'fadeIn 0.2s ease-out'
            }} 
          />
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '400px',
              background: 'var(--bg)', borderLeft: '1px solid var(--border)', zIndex: 2000,
              padding: '24px', overflowY: 'auto', boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Management</h2>
              <button onClick={() => setShowMenu(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Join Requests */}
              <section>
                <h3 style={{ fontSize: '14px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>Join Requests ({requests.length})</h3>
                {requests.length === 0 ? <p style={{ fontSize: '13px', color: 'var(--text3)' }}>No pending requests</p> : requests.map(r => (
                  <div key={r._id} style={{ padding: '12px', borderRadius: '10px', background: 'var(--navy3)', border: '1px solid var(--border)', marginBottom: '8px' }}>
                    <p style={{ fontSize: '13px', marginBottom: '8px' }}><strong>{r.sender?.name}</strong> → {r.project?.title}</p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRequest(r._id, 'accepted'); }} 
                        style={{ flex: 1, padding: '8px', background: 'rgba(34,211,165,0.1)', color: 'var(--success)', border: '1px solid rgba(34,211,165,0.3)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                      >Accept</button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRequest(r._id, 'rejected'); }} 
                        style={{ flex: 1, padding: '8px', background: 'rgba(255,94,108,0.1)', color: 'var(--danger)', border: '1px solid rgba(255,94,108,0.3)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                      >Decline</button>
                    </div>
                  </div>
                ))}
              </section>

              {/* My Invites */}
              <section>
                <h3 style={{ fontSize: '14px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>My Invites ({invites.length})</h3>
                {invites.length === 0 ? <p style={{ fontSize: '13px', color: 'var(--text3)' }}>No invites</p> : invites.map(inv => (
                  <div key={inv._id} style={{ padding: '12px', borderRadius: '10px', background: 'var(--navy3)', border: '1px solid var(--border)', marginBottom: '8px' }}>
                    <p style={{ fontSize: '13px', marginBottom: '8px' }}>Invited to <strong>{inv.project?.title}</strong></p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleInvite(inv._id, 'accepted'); }} 
                        style={{ flex: 1, padding: '8px', background: 'rgba(34,211,165,0.1)', color: 'var(--success)', border: '1px solid rgba(34,211,165,0.3)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                      >Accept</button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleInvite(inv._id, 'rejected'); }} 
                        style={{ flex: 1, padding: '8px', background: 'rgba(255,94,108,0.1)', color: 'var(--danger)', border: '1px solid rgba(255,94,108,0.3)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                      >Decline</button>
                    </div>
                  </div>
                ))}
              </section>

            {/* Bookmarks */}
            <section>
              <h3 style={{ fontSize: '14px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>Saved Projects</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {bookmarks.map(p => (
                  <div key={p._id} onClick={() => navigate(`/projects/${p._id}`)} style={{ padding: '8px 12px', background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                    ★ {p.title}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </>
    )}

      {/* Main Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activities.length > 0 ? (
          activities.map((act, i) => (
            <Card key={act._id || i} style={{ padding: '20px', border: '1px solid var(--border)', background: 'var(--card)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  fontSize: '18px'
                }}>
                  {act.type === 'PROJECT_COMPLETED' ? '🏆' : act.type === 'ENDORSEMENT' ? '✨' : act.type === 'TEAM_FULL' ? '🔥' : '📢'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', lineHeight: '1.5', color: 'var(--text)' }}>
                    {getActivityText(act)}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '6px' }}>
                    {getTimeAgo(act.createdAt)}
                  </p>
                </div>
              </div>
              {act.project && (
                <button 
                  onClick={() => navigate(`/projects/${act.project._id}`)}
                  style={{
                    marginTop: '16px', width: '100%', background: 'var(--navy3)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '10px', color: 'var(--accent2)', fontSize: '13px',
                    fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  View Project
                </button>
              )}
            </Card>
          ))
        ) : (
          /* Fallback: Projects */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Explore Projects</h2>
              <button onClick={() => navigate('/projects')} style={{ color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>See all →</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {myProjects.length > 0 ? myProjects.map(p => (
                <Card key={p._id} onClick={() => navigate(`/projects/${p._id}`)} style={{ cursor: 'pointer' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontWeight: '700', fontSize: '16px' }}>{p.title}</h3>
                    <span style={{ fontSize: '11px', background: 'rgba(34,211,165,0.1)', color: 'var(--success)', padding: '2px 8px', borderRadius: '20px' }}>{p.status}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '8px' }}>{p.description?.substring(0, 100)}...</p>
                </Card>
              )) : (
                <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>No activity yet. Start exploring projects!</p>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

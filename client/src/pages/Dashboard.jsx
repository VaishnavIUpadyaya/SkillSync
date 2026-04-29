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
const [bookmarks, setBookmarks] = useState([])
  const navigate = useNavigate()

 useEffect(() => {
  if (!user) return

  api.get('/projects')
    .then(r =>
      setMyProjects(
        r.data.filter(p => p.owner._id === user?._id)
      )
    )

  setTimeout(() => {
    api.get('/requests/mine')
      .then(r => setRequests(r.data))
  }, 200)

  setTimeout(() => {
    api.get('/requests/invites')
      .then(r => setInvites(r.data))
  }, 400)

  setTimeout(() => {
    api.get('/users/bookmarks/all')
      .then(r => setBookmarks(r.data))
  }, 600)

}, [user])
const handleRequest = async (id, status) => {
  try {
    await api.put(`/requests/${id}`, { status })
    setRequests(requests.filter(r => r._id !== id))
  } catch (err) {
    if (err.response?.status === 401) {
      alert('Session expired. Please log in again.')
      // Optionally, redirect to login page here
    } else {
      alert(err.response?.data?.msg || 'Error processing request')
    }
  }
}
  const statBox = (label, value, color) => (
    <div style={{ background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', flex: 1 }}>
      <div style={{ fontSize: '28px', fontWeight: '720', fontFamily: 'Syne, sans-serif', color }}>{value}</div>
      <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>{label}</div>
    </div>
  )
const handleInvite = async (id, status) => {
  try {
    await api.put(`/requests/${id}`, { status })
    setInvites(invites.filter(i => i._id !== id))
  } catch (err) {
    if (err.response?.status === 401) {
      alert('Session expired. Please log in again.')
      // Optionally, redirect to login page here
    } else {
      alert(err.response?.data?.msg || 'Error processing invite')
    }
  }
}
  return (
    <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          Hey, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text2)', marginTop: '4px', fontSize: '15px' }}>Here's what's happening with your projects</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', minWidth: 0 }}>
        {statBox('My Projects', myProjects.length, 'var(--text)')}
        {statBox('Pending Requests', requests.length, 'var(--danger)')}
        {statBox('Rating', user?.rating > 0 ? `${user.rating}/5` : '—', 'var(--success)')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', minWidth: 0 }}>
        <Card style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700' }}>My Projects</h2>
            <button onClick={() => navigate('/projects')} style={{
              background: 'var(--accent2)', color: 'white', border: 'none',
              borderRadius: '8px', padding: '6px 14px', fontSize: '12px',
              fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif'
            }}>+ New</button>
          </div>
          {myProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)' }}>
              <p style={{ fontSize: '14px' }}>No projects yet</p>
              <Link to="/projects" style={{ color: 'var(--accent2)', fontSize: '13px', textDecoration: 'none' }}>Create your first project →</Link>
            </div>
          ) : myProjects.map(p => (
            <Link key={p._id} to={`/projects/${p._id}`} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '12px', borderRadius: '10px', marginBottom: '8px', background: 'var(--navy3)', border: '1px solid var(--border)', transition: 'border-color 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text)' }}>{p.title}</span>
                  <span style={{ fontSize: '11px', background: 'rgba(34,211,165,0.1)', color: 'var(--success)', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(34,211,165,0.2)' }}>{p.status}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>{p.members.length}/{p.teamSize} members</p>
              </div>
            </Link>
          ))}
        </Card>

        <Card style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
            Join Requests
            {requests.length > 0 && <span style={{ marginLeft: '8px', background: 'var(--accent2)', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>{requests.length}</span>}
          </h2>
          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: '14px' }}>
              No pending requests
            </div>
          ) : requests.map(r => (
            <div key={r._id} style={{ padding: '14px', borderRadius: '10px', marginBottom: '10px', background: 'var(--navy3)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', fontFamily: 'Syne, sans-serif', flexShrink: 0 }}>
                  {r.sender.name[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: '600', fontSize: '14px' }}>{r.sender.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text2)' }}>wants to join <span style={{ color: 'var(--accent2)' }}>{r.project.title}</span></p>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                {r.sender.skills?.slice(0, 3).map((s, i) => <SkillTag key={i} name={s.name} size="sm" />)}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleRequest(r._id, 'accepted')} style={{
                  flex: 1, background: 'rgba(34,211,165,0.1)', color: 'var(--success)',
                  border: '1px solid rgba(34,211,165,0.3)', borderRadius: '8px',
                  padding: '7px', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                }}>Accept</button>
                <button onClick={() => handleRequest(r._id, 'rejected')} style={{
                  flex: 1, background: 'rgba(255,94,108,0.1)', color: 'var(--danger)',
                  border: '1px solid rgba(255,94,108,0.3)', borderRadius: '8px',
                  padding: '7px', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                }}>Decline</button>
              </div>
            </div>
          ))}
        </Card>
          {invites.length > 0 && (
        <Card style={{ marginTop: '1.5rem', minWidth: 0 }}>
    <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
      My Invites
      <span style={{ marginLeft: '8px', background: 'var(--accent)', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>{invites.length}</span>
    </h2>
    {invites.map(inv => (
      <div key={inv._id} style={{ padding: '14px', borderRadius: '10px', marginBottom: '10px', background: 'var(--navy3)', border: '1px solid var(--border)' }}>
        <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
          You're invited to <span style={{ color: 'var(--accent2)' }}>{inv.project.title}</span>
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '12px' }}>{inv.project.description}</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => handleInvite(inv._id, 'accepted')} style={{
            flex: 1, background: 'rgba(34,211,165,0.1)', color: 'var(--success)',
            border: '1px solid rgba(34,211,165,0.3)', borderRadius: '8px',
            padding: '7px', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
          }}>Accept</button>
          <button onClick={() => handleInvite(inv._id, 'rejected')} style={{
            flex: 1, background: 'rgba(255,94,108,0.1)', color: 'var(--danger)',
            border: '1px solid rgba(255,94,108,0.3)', borderRadius: '8px',
            padding: '7px', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
          }}>Decline</button>
        </div>
      </div>
    ))}
  </Card>
)}
{bookmarks.length > 0 && (
  <Card style={{ marginTop: '1.5rem', gridColumn: '1 / -1', minWidth: 0 }}>
    <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
      Saved Projects
      <span style={{ marginLeft: '8px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(245,158,11,0.3)' }}>{bookmarks.length}</span>
    </h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.625rem', minWidth: 0 }}>
      {bookmarks.map(p => (
        <div key={p._id} onClick={() => navigate(`/projects/${p._id}`)} style={{
          padding: '12px', borderRadius: '10px', background: 'var(--navy3)',
          border: '1px solid var(--border)', cursor: 'pointer', transition: 'border-color 0.2s'
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text)' }}>{p.title}</span>
            <span style={{ fontSize: '14px', color: '#f59e0b' }}>★</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text3)' }}>by {p.owner?.name}</p>
          <span style={{
            display: 'inline-block', marginTop: '6px', fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
            background: p.status === 'open' ? 'rgba(34,211,165,0.1)' : 'rgba(108,99,255,0.1)',
            color: p.status === 'open' ? 'var(--success)' : 'var(--accent2)',
            border: `1px solid ${p.status === 'open' ? 'rgba(34,211,165,0.2)' : 'rgba(108,99,255,0.2)'}`
          }}>{p.status}</span>
        </div>
      ))}
    </div>
  </Card>
)}
      </div>
    </div>
  )
}
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
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/projects').then(r => setMyProjects(r.data.filter(p => p.owner._id === user?._id)))
    api.get('/requests/mine').then(r => setRequests(r.data))
  }, [user])

  const handleRequest = async (id, status) => {
    await api.put(`/requests/${id}`, { status })
    setRequests(requests.filter(r => r._id !== id))
  }

  const statBox = (label, value, color) => (
    <div style={{ background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', flex: 1 }}>
      <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Syne, sans-serif', color }}>{value}</div>
      <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>{label}</div>
    </div>
  )

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          Hey, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text2)', marginTop: '4px', fontSize: '15px' }}>Here's what's happening with your projects</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        {statBox('My Projects', myProjects.length, 'var(--accent2)')}
        {statBox('Pending Requests', requests.length, 'var(--success)')}
        {statBox('Rating', user?.rating > 0 ? `${user.rating}/5` : '—', 'var(--text)')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700' }}>My Projects</h2>
            <button onClick={() => navigate('/projects')} style={{
              background: 'var(--accent)', color: 'white', border: 'none',
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

        <Card>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
            Join Requests
            {requests.length > 0 && <span style={{ marginLeft: '8px', background: 'var(--accent)', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>{requests.length}</span>}
          </h2>
          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: '14px' }}>
              No pending requests
            </div>
          ) : requests.map(r => (
            <div key={r._id} style={{ padding: '14px', borderRadius: '10px', marginBottom: '10px', background: 'var(--navy3)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', fontFamily: 'Syne, sans-serif', flexShrink: 0 }}>
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
      </div>
    </div>
  )
}
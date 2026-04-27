import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import Card from '../components/Card'

export default function Analytics() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [project, setProject] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/projects/${id}`).then(r => setProject(r.data))
    api.get(`/projects/${id}/analytics`).then(r => setData(r.data))
  }, [id])

  if (!data || !project) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text3)' }}>Loading...</div>
  )

  const statCard = (label, value, sub, color) => (
    <div style={{ background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px' }}>
      <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Syne, sans-serif', color: color || 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>{label}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>{sub}</div>}
    </div>
  )

  const Bar = ({ label, value, max, color }) => (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: '600', color }}>{value}</span>
      </div>
      <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px' }}>
        <div style={{
          height: '100%', borderRadius: '3px',
          width: max > 0 ? `${(value / max) * 100}%` : '0%',
          background: color, transition: 'width 0.6s ease'
        }} />
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
      <button onClick={() => navigate(`/projects/${id}`)} style={{
        background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
        fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0
      }}>← Back to Project</button>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Analytics</h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '4px' }}>{project.title}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {statCard('Total Views', data.views, 'people visited', 'var(--accent2)')}
        {statCard('Team Fill', data.teamFill, 'members joined', 'var(--success)')}
        {statCard('Join Requests', data.requests.total, `${data.requests.accepted} accepted`, '#f59e0b')}
        {statCard('Avg Rating', data.ratings.avg || '—', data.ratings.count > 0 ? `${data.ratings.count} reviews` : 'no reviews yet', '#f59e0b')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Card>
          <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Request Breakdown</p>
          <Bar label="Accepted" value={data.requests.accepted} max={data.requests.total} color="var(--success)" />
          <Bar label="Pending" value={data.requests.pending} max={data.requests.total} color="var(--accent2)" />
          <Bar label="Rejected" value={data.requests.rejected} max={data.requests.total} color="var(--danger)" />
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--navy3)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
              Acceptance rate: <span style={{ color: 'var(--success)', fontWeight: '600' }}>
                {data.requests.total > 0 ? `${Math.round((data.requests.accepted / data.requests.total) * 100)}%` : 'N/A'}
              </span>
            </p>
          </div>
        </Card>

        <Card>
          <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invite Breakdown</p>
          <Bar label="Invites Sent" value={data.invites.total} max={data.invites.total || 1} color="var(--accent)" />
          <Bar label="Invites Accepted" value={data.invites.accepted} max={data.invites.total || 1} color="var(--success)" />
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--navy3)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
              Invite acceptance rate: <span style={{ color: 'var(--success)', fontWeight: '600' }}>
                {data.invites.total > 0 ? `${Math.round((data.invites.accepted / data.invites.total) * 100)}%` : 'N/A'}
              </span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
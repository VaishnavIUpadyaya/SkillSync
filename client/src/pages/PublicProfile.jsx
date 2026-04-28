import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Card from '../components/Card'
import SkillTag from '../components/SkillTag'

export default function PublicProfile() {
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  const [data, setData] = useState(null)
  const [endorsements, setEndorsements] = useState({})
  const [endorsed, setEndorsed] = useState({})
  const [endorsing, setEndorsing] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/users/${id}/profile`).then(r => setData(r.data))
    api.get(`/endorsements/${id}`).then(r => setEndorsements(r.data))
  }, [id])

  useEffect(() => {
    if (!data) return
    data.user.skills.forEach(s => {
      api.get(`/endorsements/check/${id}/${encodeURIComponent(s.name)}`)
        .then(r => setEndorsed(prev => ({ ...prev, [s.name]: r.data.endorsed })))
        .catch(() => {})
    })
  }, [data, id])

  const handleEndorse = async (skill) => {
    setEndorsing(prev => ({ ...prev, [skill]: true }))
    try {
      await api.post('/endorsements', { endorseeId: id, skill })
      setEndorsed(prev => ({ ...prev, [skill]: true }))
      setEndorsements(prev => ({
        ...prev,
        [skill]: [...(prev[skill] || []), currentUser.name]
      }))
    } catch (err) {
      alert(err.response?.data?.msg || 'Error')
    } finally {
      setEndorsing(prev => ({ ...prev, [skill]: false }))
    }
  }

  if (!data) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text3)' }}>Loading...</div>
  )

  const { user, projects, ratings } = data
  const isOwnProfile = currentUser?._id === id
  const stars = (score) => '★'.repeat(score) + '☆'.repeat(5 - score)

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
        fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0
      }}>← Back</button>

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
        {user.availableDates.length > 10 && (
          <span style={{ fontSize: '12px', color: 'var(--text3)', alignSelf: 'center' }}>+{user.availableDates.length - 10} more</span>
        )}
      </div>
    </div>
  )}

  <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skills</p>
        {user.skills.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>No skills added</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {user.skills.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--navy3)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <SkillTag name={s.name} proficiency={s.proficiency} />
                  {endorsements[s.name]?.length > 0 && (
                    <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                      endorsed by {endorsements[s.name].slice(0, 2).join(', ')}
                      {endorsements[s.name].length > 2 && ` +${endorsements[s.name].length - 2}`}
                      <span style={{ marginLeft: '6px', background: 'rgba(108,99,255,0.15)', color: 'var(--accent2)', padding: '1px 6px', borderRadius: '10px', fontSize: '11px' }}>
                        {endorsements[s.name].length}
                      </span>
                    </span>
                  )}
                </div>
                {!isOwnProfile && (
                  <button onClick={() => handleEndorse(s.name)}
                    disabled={endorsed[s.name] || endorsing[s.name]}
                    style={{
                      background: endorsed[s.name] ? 'rgba(34,211,165,0.1)' : 'rgba(108,99,255,0.12)',
                      color: endorsed[s.name] ? 'var(--success)' : 'var(--accent2)',
                      border: `1px solid ${endorsed[s.name] ? 'rgba(34,211,165,0.3)' : 'rgba(108,99,255,0.25)'}`,
                      borderRadius: '8px', padding: '5px 12px', fontSize: '12px',
                      fontWeight: '600', cursor: endorsed[s.name] ? 'default' : 'pointer',
                      fontFamily: 'Syne, sans-serif', transition: 'all 0.2s'
                    }}>
                    {endorsing[s.name] ? '...' : endorsed[s.name] ? '✓ Endorsed' : '+ Endorse'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Projects ({projects.length})
        </p>
        {projects.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>No projects yet</p>
        ) : projects.map(p => (
          <div key={p._id} onClick={() => navigate(`/projects/${p._id}`)} style={{
            padding: '12px', borderRadius: '10px', marginBottom: '8px',
            background: 'var(--navy3)', border: '1px solid var(--border)',
            cursor: 'pointer', transition: 'border-color 0.2s'
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', fontSize: '14px' }}>{p.title}</span>
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                background: p.status === 'completed' ? 'rgba(245,158,11,0.1)' : 'rgba(108,99,255,0.1)',
                color: p.status === 'completed' ? '#f59e0b' : 'var(--accent2)',
                border: `1px solid ${p.status === 'completed' ? 'rgba(245,158,11,0.2)' : 'rgba(108,99,255,0.2)'}`
              }}>{p.status}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>by {p.owner.name}</p>
          </div>
        ))}
      </Card>

      <Card>
        <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Reviews ({ratings.length})
        </p>
        {ratings.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text3)' }}>No reviews yet</p>
        ) : ratings.map(r => (
          <div key={r._id} style={{ padding: '14px', borderRadius: '10px', marginBottom: '10px', background: 'var(--navy3)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600' }}>{r.rater.name}</span>
              <span style={{ fontSize: '14px', color: '#f59e0b', letterSpacing: '2px' }}>{stars(r.score)}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>on {r.project.title}</p>
            {r.comment && <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '6px' }}>{r.comment}</p>}
          </div>
        ))}
      </Card>
    </div>
  )
}
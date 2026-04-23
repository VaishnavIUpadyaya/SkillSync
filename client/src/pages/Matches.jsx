import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import Card from '../components/Card'
import SkillTag from '../components/SkillTag'

export default function Matches() {
  const { id } = useParams()
  const [matches, setMatches] = useState([])
  const navigate = useNavigate()

  useEffect(() => { api.get(`/projects/${id}/matches`).then(r => setMatches(r.data)) }, [id])

  const scoreColor = (score) => {
    if (score >= 0.8) return 'var(--success)'
    if (score >= 0.5) return 'var(--accent2)'
    return 'var(--text2)'
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Recommended Members</h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '4px' }}>Ranked by skill compatibility</p>
        </div>
        <button onClick={() => navigate(`/projects/${id}`)} style={{
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--text2)', borderRadius: '10px', padding: '8px 16px',
          fontSize: '13px', cursor: 'pointer'
        }}>← Back to Project</button>
      </div>

      {matches.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: 'var(--text3)', fontSize: '15px' }}>No matches found.</p>
          <p style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '8px' }}>Make sure other users have added their skills in their profile.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {matches.map(({ user, score }, index) => (
            <div key={user._id} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '20px 24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '800', fontSize: '16px', fontFamily: 'Syne, sans-serif'
                  }}>{user.name[0].toUpperCase()}</div>
                  {index === 0 && (
                    <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', background: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>★</div>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{user.name}</span>
                    {user.role && <span style={{ fontSize: '12px', color: 'var(--text3)', background: 'var(--navy3)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>{user.role}</span>}
                    {user.rating > 0 && <span style={{ fontSize: '12px', color: '#f59e0b' }}>★ {user.rating}</span>}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {user.skills.map((s, i) => <SkillTag key={i} name={s.name} proficiency={s.proficiency} size="sm" />)}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, marginLeft: '20px' }}>
                <div style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'Syne, sans-serif', color: scoreColor(score), lineHeight: 1 }}>
                  {(score * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>match</div>
                <div style={{ width: '60px', height: '4px', background: 'var(--border)', borderRadius: '2px', marginTop: '8px' }}>
                  <div style={{ height: '100%', width: `${score * 100}%`, background: scoreColor(score), borderRadius: '2px', transition: 'width 0.5s' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
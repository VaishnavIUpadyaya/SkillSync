import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import Card from '../components/Card'
import SkillTag from '../components/SkillTag'

function Avatar({ user, size = 48 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: user.profilePic ? 'transparent' : 'var(--accent3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: '800', fontSize: size * 0.38, fontFamily: 'Syne, sans-serif',
      color: '#fff',
      boxShadow: '0 2px 12px rgba(87,34,218,0.25)'
    }}>
      {user.profilePic
        ? <img src={user.profilePic} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : user.name?.[0]?.toUpperCase()
      }
    </div>
  )
}

function StarRating({ score, count }) {
  if (!score || score === 0) return null
  const full = Math.floor(score)
  const half = score - full >= 0.5
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#f59e0b' }}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
      <span style={{ color: 'var(--text3)', fontSize: '11px', marginLeft: '2px' }}>({count})</span>
    </span>
  )
}

function UserCard({ user }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => navigate(`/users/${user._id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--glass-hover)' : 'var(--glass)',
        border: `1px solid ${hovered ? 'rgba(108,99,255,0.4)' : 'var(--glass-border)'}`,
        borderRadius: '16px',
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.22), 0 0 0 1px rgba(108,99,255,0.15)' : 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Avatar user={user} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.name}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.role || 'No role set'}
          </p>
          <StarRating score={user.rating} count={user.ratingCount} />
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>

      {/* Skills */}
      {user.skills?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {user.skills.slice(0, 5).map((s, i) => (
            <SkillTag key={i} name={s.name} proficiency={s.proficiency} verified={s.verified} />
          ))}
          {user.skills.length > 5 && (
            <span style={{ fontSize: '11px', color: 'var(--text3)', alignSelf: 'center', padding: '4px 8px', background: 'var(--glass)', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
              +{user.skills.length - 5} more
            </span>
          )}
        </div>
      )}
      {(!user.skills || user.skills.length === 0) && (
        <p style={{ fontSize: '12px', color: 'var(--text3)', fontStyle: 'italic' }}>No skills listed</p>
      )}
    </div>
  )
}

export default function UserSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [skillFilter, setSkillFilter] = useState(searchParams.get('skill') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const doSearch = useCallback(async (q, skill) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (skill.trim()) params.set('skill', skill.trim())
      const res = await api.get(`/users/search?${params.toString()}`)
      setResults(res.data)
      setSearched(true)
      // Sync URL
      const urlParams = {}
      if (q.trim()) urlParams.q = q.trim()
      if (skill.trim()) urlParams.skill = skill.trim()
      setSearchParams(urlParams, { replace: true })
    } catch (err) {
      setError(err.response?.data?.msg || 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [setSearchParams])

  // Debounced live search
  useEffect(() => {
    if (!query.trim() && !skillFilter.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(query, skillFilter)
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [query, skillFilter, doSearch])

  // If URL has params on mount, search immediately
  useEffect(() => {
    const q = searchParams.get('q') || ''
    const skill = searchParams.get('skill') || ''
    if (q || skill) doSearch(q, skill)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clearAll = () => {
    setQuery('')
    setSkillFilter('')
    setResults([])
    setSearched(false)
    setSearchParams({}, { replace: true })
    inputRef.current?.focus()
  }

  const hasFilters = query.trim() || skillFilter.trim()

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 0 60px', animation: 'fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
          fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center',
          gap: '6px', padding: 0, transition: 'color 0.2s'
        }}
          onMouseEnter={e => e.target.style.color = 'var(--accent2)'}
          onMouseLeave={e => e.target.style.color = 'var(--text2)'}
        >← Back</button>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(26px, 5vw, 34px)', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>
              Find People
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text3)', marginTop: '6px' }}>
              Search by name or skill to discover collaborators
            </p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <Card style={{ marginBottom: '24px', padding: '20px 22px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Name / general search */}
          <div style={{ position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              id="user-search-input"
              type="text"
              placeholder="Search by name or skill (e.g. React, Vaishnavi…)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%', background: 'var(--navy3)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '12px 14px 12px 42px',
                color: 'var(--text)', fontSize: '15px', outline: 'none',
                fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent2)'; e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.15)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer',
                fontSize: '18px', lineHeight: 1, padding: '2px 4px',
              }}>×</button>
            )}
          </div>

          {/* Skill filter row */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <input
                id="skill-filter-input"
                type="text"
                placeholder="Filter by skill (e.g. Python)"
                value={skillFilter}
                onChange={e => setSkillFilter(e.target.value)}
                style={{
                  width: '100%', background: 'var(--navy3)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '10px 12px 10px 36px',
                  color: 'var(--text)', fontSize: '14px', outline: 'none',
                  fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent2)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              {skillFilter && (
                <button onClick={() => setSkillFilter('')} style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer',
                  fontSize: '16px', lineHeight: 1,
                }}>×</button>
              )}
            </div>

            {hasFilters && (
              <button onClick={clearAll} style={{
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text3)', borderRadius: '10px', padding: '10px 16px',
                fontSize: '13px', cursor: 'pointer', fontWeight: '600',
                transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--danger)'; e.target.style.color = 'var(--danger)' }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text3)' }}
              >Clear all</button>
            )}
          </div>
        </div>
      </Card>

      {/* Quick skill chips */}
      {!hasFilters && (
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Popular skills
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['React', 'Python', 'Machine Learning', 'Node.js', 'Flutter', 'TypeScript', 'UI/UX', 'DevOps', 'Go', 'Rust'].map(s => (
              <button key={s} onClick={() => setSkillFilter(s)} style={{
                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                color: 'var(--text2)', borderRadius: '20px', padding: '6px 14px',
                fontSize: '12px', cursor: 'pointer', fontWeight: '500',
                transition: 'all 0.18s', fontFamily: 'DM Sans, sans-serif'
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108,99,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(108,99,255,0.4)'; e.currentTarget.style.color = 'var(--accent2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text2)' }}
              >{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px', color: 'var(--text3)', gap: '10px', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ animation: 'spin 0.9s linear infinite' }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          Searching…
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ background: 'rgba(255,94,108,0.1)', border: '1px solid rgba(255,94,108,0.25)', borderRadius: '12px', padding: '14px 18px', color: 'var(--danger)', fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Empty state — no search yet */}
      {!loading && !searched && !hasFilters && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text2)', marginBottom: '6px' }}>Find your next collaborator</p>
          <p style={{ fontSize: '14px' }}>Type a name or pick a skill above to get started</p>
        </div>
      )}

      {/* No results */}
      {!loading && searched && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
          <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text2)', marginBottom: '6px' }}>No users found</p>
          <p style={{ fontSize: '14px' }}>Try a different name or skill</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div>
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {results.map(u => <UserCard key={u._id} user={u} />)}
          </div>
        </div>
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

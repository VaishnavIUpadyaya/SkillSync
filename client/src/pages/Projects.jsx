import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Card from '../components/Card'
import SkillTag from '../components/SkillTag'

const TAGS = ['Web Dev', 'ML/AI', 'Mobile', 'Research', 'Game Dev', 'DevOps', 'Design', 'Other']

const inputStyle = {
  background: 'var(--navy3)', border: '1px solid var(--border)',
  borderRadius: '10px', padding: '11px 14px', color: 'var(--text)',
  fontSize: '14px', width: '100%', outline: 'none',
  transition: 'border-color 0.2s', fontFamily: 'DM Sans, sans-serif',
}

const normalize = (s) => s.toLowerCase().replace(/\./g, '').replace(/\s+/g, '').replace(/-/g, '')

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [filterSkill, setFilterSkill] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTag, setFilterTag] = useState('all')
  const [form, setForm] = useState({ title: '', description: '', teamSize: 4, requiredSkills: [], tags: [], deadline: '' })
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 3 })
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { api.get('/projects').then(r => setProjects(r.data)) }, [])

  const addSkill = () => {
    if (!newSkill.name.trim()) return
    setForm({ ...form, requiredSkills: [...form.requiredSkills, { ...newSkill }] })
    setNewSkill({ name: '', proficiency: 3 })
  }

  const toggleTag = (tag) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const res = await api.post('/projects', form)
    navigate(`/projects/${res.data._id}`)
  }

  const filtered = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    const matchSkill = filterSkill === '' ||
      p.requiredSkills.some(s => normalize(s.name).includes(normalize(filterSkill)))
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
   const matchTag = filterTag === 'all' || (p.tags && p.tags.some(t => t.toLowerCase() === filterTag.toLowerCase()))
    return matchSearch && matchSkill && matchStatus && matchTag
  })

  const clearFilters = () => { setSearch(''); setFilterSkill(''); setFilterStatus('all'); setFilterTag('all') }
  const hasFilters = search || filterSkill || filterStatus !== 'all' || filterTag !== 'all'

  const tagColor = (tag) => {
    const colors = {
      'Web Dev': '#6c63ff', 'ML/AI': '#22d3a5', 'Mobile': '#f59e0b',
      'Research': '#ec4899', 'Game Dev': '#ef4444', 'DevOps': '#3b82f6',
      'Design': '#a855f7', 'Other': '#6b7280'
    }
    return colors[tag] || '#6c63ff'
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Projects</h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '4px' }}>
            {filtered.length} of {projects.length} projects
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          background: showForm ? 'transparent' : 'var(--accent2)', color: showForm ? 'var(--text2)' : 'white',
          border: showForm ? '1px solid var(--border)' : 'none',
          borderRadius: '10px', padding: '10px 20px', fontSize: '14px',
          fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif'
        }}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', marginBottom: '16px' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input style={{ ...inputStyle, paddingLeft: '38px' }}
            placeholder="Search projects..."
            value={search} onChange={e => setSearch(e.target.value)}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        <input style={inputStyle} placeholder="Filter by skill..."
          value={filterSkill} onChange={e => setFilterSkill(e.target.value)}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        <select style={{ ...inputStyle, cursor: 'pointer' }}
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select style={{ ...inputStyle, cursor: 'pointer' }}
          value={filterTag} onChange={e => setFilterTag(e.target.value)}>
          <option value="all">All Tags</option>
          {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} style={{
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text2)', borderRadius: '10px', padding: '0 14px',
            fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap'
          }}>Clear</button>
        )}
      </div>

      {showForm && (
        <Card style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Create New Project</h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>Project Title</label>
                <input style={inputStyle} placeholder="e.g. AI Study Helper"
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} required />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>Team Size</label>
                <input style={inputStyle} type="number" min="2" max="10"
                  value={form.teamSize} onChange={e => setForm({...form, teamSize: Number(e.target.value)})}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>Deadline</label>
                <input style={{ ...inputStyle, colorScheme: 'dark' }} type="date"
                  value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>Description</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                placeholder="Describe your project..."
                value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} required />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '8px', display: 'block' }}>Tags</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {TAGS.map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)} style={{
                    padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: form.tags.includes(tag) ? `${tagColor(tag)}22` : 'transparent',
                    color: form.tags.includes(tag) ? tagColor(tag) : 'var(--text3)',
                    border: `1px solid ${form.tags.includes(tag) ? tagColor(tag) : 'var(--border)'}`
                  }}>{tag}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '8px', display: 'block' }}>Required Skills</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px', minHeight: '28px' }}>
                {form.requiredSkills.map((s, i) => <SkillTag key={i} name={s.name} proficiency={s.proficiency} />)}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="Skill name"
                  value={newSkill.name} onChange={e => setNewSkill({...newSkill, name: e.target.value})}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                <select style={{ ...inputStyle, width: '80px' }} value={newSkill.proficiency}
                  onChange={e => setNewSkill({...newSkill, proficiency: Number(e.target.value)})}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}/5</option>)}
                </select>
                <button type="button" onClick={addSkill} style={{
                  background: 'var(--navy3)', color: 'var(--text)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '0 16px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap'
                }}>Add</button>
              </div>
            </div>
            <button type="submit" style={{
              background: 'var(--accent)', color: 'white', border: 'none',
              borderRadius: '10px', padding: '13px', fontSize: '15px',
              fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif'
            }}>Create Project</button>
          </form>
        </Card>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No projects found</p>
          <p style={{ fontSize: '13px' }}>Try adjusting your search or filters</p>
          {hasFilters && (
            <button onClick={clearFilters} style={{
              marginTop: '16px', background: 'var(--accent)', color: 'white',
              border: 'none', borderRadius: '8px', padding: '8px 16px',
              fontSize: '13px', cursor: 'pointer'
            }}>Clear filters</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filtered.map(p => {
            const daysLeft = p.deadline ? Math.ceil((new Date(p.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null
            return (
              <div key={p._id} style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px',
                padding: '20px 24px', transition: 'border-color 0.2s, transform 0.2s', cursor: 'pointer'
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
                onClick={() => navigate(`/projects/${p._id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>{p.title}</h3>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                        background: p.status === 'open' ? 'rgba(34,211,165,0.1)' : p.status === 'in-progress' ? 'rgba(108,99,255,0.1)' : 'rgba(245,158,11,0.1)',
                        color: p.status === 'open' ? 'var(--success)' : p.status === 'in-progress' ? 'var(--accent2)' : '#f59e0b',
                        border: `1px solid ${p.status === 'open' ? 'rgba(34,211,165,0.2)' : p.status === 'in-progress' ? 'rgba(108,99,255,0.2)' : 'rgba(245,158,11,0.2)'}`
                      }}>{p.status}</span>
                      {p.tags?.map(tag => (
                        <span key={tag} style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                          background: `${tagColor(tag)}18`,
                          color: tagColor(tag),
                          border: `1px solid ${tagColor(tag)}40`
                        }}>{tag}</span>
                      ))}
                      {daysLeft !== null && (
                        <span style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                          background: daysLeft < 3 ? 'rgba(255,94,108,0.1)' : 'rgba(255,255,255,0.05)',
                          color: daysLeft < 3 ? 'var(--danger)' : 'var(--text3)',
                          border: `1px solid ${daysLeft < 3 ? 'rgba(255,94,108,0.3)' : 'var(--border)'}`
                        }}>
                          {daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px', lineHeight: 1.5 }}>{p.description}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {p.requiredSkills.map((s, i) => (
                        <span key={i} style={{
                          background: filterSkill && normalize(s.name).includes(normalize(filterSkill)) ? 'rgba(108,99,255,0.25)' : 'rgba(108,99,255,0.12)',
                          border: `1px solid ${filterSkill && normalize(s.name).includes(normalize(filterSkill)) ? 'rgba(108,99,255,0.6)' : 'rgba(108,99,255,0.25)'}`,
                          color: 'var(--accent2)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500'
                        }}>{s.name} <span style={{ color: 'var(--text3)', fontSize: '11px' }}>{s.proficiency}/5</span></span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '20px', flexShrink: 0 }}>
                    <p style={{ fontSize: '12px', color: 'var(--text3)' }}>by {p.owner.name}</p>
                    <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
                      <span style={{ color: 'var(--accent2)', fontWeight: '600' }}>{p.members.length}</span>/{p.teamSize} members
                    </p>
                    {p.views > 0 && (
                      <p style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                        👁 {p.views} views
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
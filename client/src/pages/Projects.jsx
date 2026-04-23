import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import Card from '../components/Card'
import SkillTag from '../components/SkillTag'

const inputStyle = {
  background: 'var(--navy3)', border: '1px solid var(--border)',
  borderRadius: '10px', padding: '11px 14px', color: 'var(--text)',
  fontSize: '14px', width: '100%', outline: 'none',
  transition: 'border-color 0.2s', fontFamily: 'DM Sans, sans-serif',
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({ title: '', description: '', teamSize: 4, requiredSkills: [] })
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 3 })
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { api.get('/projects').then(r => setProjects(r.data)) }, [])

  const addSkill = () => {
    if (!newSkill.name.trim()) return
    setForm({ ...form, requiredSkills: [...form.requiredSkills, { ...newSkill }] })
    setNewSkill({ name: '', proficiency: 3 })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const res = await api.post('/projects', form)
    navigate(`/projects/${res.data._id}`)
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Projects</h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '4px' }}>{projects.length} open projects</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          background: showForm ? 'transparent' : 'var(--accent)', color: showForm ? 'var(--text2)' : 'white',
          border: showForm ? '1px solid var(--border)' : 'none',
          borderRadius: '10px', padding: '10px 20px', fontSize: '14px',
          fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif'
        }}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Create New Project</h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
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
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }}>Description</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} placeholder="Describe your project..."
                value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} required />
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

      <div style={{ display: 'grid', gap: '16px' }}>
        {projects.map(p => (
          <div key={p._id} style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px',
            padding: '20px 24px', transition: 'border-color 0.2s, transform 0.2s', cursor: 'pointer'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
            onClick={() => navigate(`/projects/${p._id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>{p.title}</h3>
                  <span style={{ fontSize: '11px', background: 'rgba(34,211,165,0.1)', color: 'var(--success)', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(34,211,165,0.2)' }}>{p.status}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px', lineHeight: 1.5 }}>{p.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {p.requiredSkills.map((s, i) => <SkillTag key={i} name={s.name} proficiency={s.proficiency} />)}
                </div>
              </div>
              <div style={{ textAlign: 'right', marginLeft: '20px', flexShrink: 0 }}>
                <p style={{ fontSize: '12px', color: 'var(--text3)' }}>by {p.owner.name}</p>
                <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
                  <span style={{ color: 'var(--accent2)', fontWeight: '600' }}>{p.members.length}</span>/{p.teamSize} members
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
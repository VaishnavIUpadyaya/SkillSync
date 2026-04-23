import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Card from '../components/Card'
import SkillTag from '../components/SkillTag'

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [requested, setRequested] = useState(false)
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => { api.get(`/projects/${id}`).then(r => setProject(r.data)) }, [id])

  const isOwner = project?.owner._id === user?._id
  const isMember = project?.members.some(m => m._id === user?._id)

  const sendRequest = async () => {
    try {
      await api.post('/requests', { projectId: id })
      setRequested(true)
      setMsg('Request sent successfully!')
    } catch (err) { setMsg(err.response?.data?.msg || 'Error') }
  }

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return
    await api.delete(`/projects/${id}/members/${userId}`)
    setProject({ ...project, members: project.members.filter(m => m._id !== userId) })
  }

  const deleteProject = async () => {
    if (!window.confirm('Delete this project permanently?')) return
    await api.delete(`/projects/${id}`)
    navigate('/projects')
  }

  if (!project) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text3)' }}>Loading...</div>
  )

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      <button onClick={() => navigate('/projects')} style={{
        background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
        fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0
      }}>← Back to Projects</button>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>{project.title}</h1>
          <span style={{ fontSize: '12px', background: 'rgba(34,211,165,0.1)', color: 'var(--success)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(34,211,165,0.2)', flexShrink: 0 }}>{project.status}</span>
        </div>

        <p style={{ color: 'var(--text2)', fontSize: '15px', lineHeight: 1.6, marginBottom: '8px' }}>{project.description}</p>
        <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '24px' }}>by {project.owner.name} · {project.members.length}/{project.teamSize} members</p>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Required Skills</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {project.requiredSkills.map((s, i) => <SkillTag key={i} name={s.name} proficiency={s.proficiency} />)}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Members</p>
          {project.members.map(m => (
            <div key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', fontFamily: 'Syne, sans-serif', flexShrink: 0 }}>
                  {m.name[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: '600', fontSize: '14px' }}>{m.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
                    {m.role}
                    {(isOwner || isMember) && m.email && <span style={{ marginLeft: '8px', color: 'var(--text3)' }}>{m.email}</span>}
                  </p>
                </div>
              </div>
              {isOwner && m._id !== user._id && (
                <button onClick={() => removeMember(m._id)} style={{
                  background: 'rgba(255,94,108,0.08)', color: 'var(--danger)',
                  border: '1px solid rgba(255,94,108,0.2)', borderRadius: '6px',
                  padding: '4px 12px', fontSize: '12px', cursor: 'pointer'
                }}>Remove</button>
              )}
            </div>
          ))}
        </div>

        {msg && (
          <div style={{ background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: 'var(--success)', fontSize: '14px' }}>
            {msg}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {isOwner && (
            <>
              <button onClick={() => navigate(`/projects/${id}/matches`)} style={{
                background: 'var(--accent)', color: 'white', border: 'none',
                borderRadius: '10px', padding: '11px 20px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif'
              }}>View Matches</button>
              <button onClick={deleteProject} style={{
                background: 'rgba(255,94,108,0.08)', color: 'var(--danger)',
                border: '1px solid rgba(255,94,108,0.2)', borderRadius: '10px',
                padding: '11px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
              }}>Delete Project</button>
            </>
          )}
          {!isOwner && !isMember && !requested && (
            <button onClick={sendRequest} style={{
              background: 'var(--accent)', color: 'white', border: 'none',
              borderRadius: '10px', padding: '11px 20px', fontSize: '14px',
              fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif'
            }}>Request to Join</button>
          )}
          {(requested || isMember) && !isOwner && (
            <span style={{ color: 'var(--success)', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
              {isMember ? 'You are a member' : 'Request sent!'}
            </span>
          )}
        </div>
      </Card>
    </div>
  )
}
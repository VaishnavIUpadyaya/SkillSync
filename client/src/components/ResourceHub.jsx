import { useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'

const CATEGORY_ICONS = {
  GitHub: '💻',
  Figma: '🎨',
  Notion: '📝',
  Drive: '📁',
  Demo: '🚀',
  General: '🔗'
}

export default function ResourceHub({ projectId, resources = [], canManage = false, onUpdate }) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', url: '', category: 'General' })

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.title || !form.url) return
    setLoading(true)
    try {
      const res = await api.post(`/projects/${projectId}/resources`, form)
      toast.success('Resource added!')
      setForm({ title: '', url: '', category: 'General' })
      setShowModal(false)
      if (onUpdate) onUpdate(res.data)
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to add resource')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (resourceId) => {
    try {
      const res = await api.delete(`/projects/${projectId}/resources/${resourceId}`)
      toast.success('Resource removed')
      if (onUpdate) onUpdate(res.data)
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to delete resource')
    }
  }

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '24px',
      marginTop: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📁 Project Resources & Links
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '2px' }}>
            Pinned links, Figma designs, repos & Notion docs for team members
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'rgba(108,99,255,0.12)',
              color: 'var(--accent2)',
              border: '1px solid rgba(108,99,255,0.25)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ➕ Add Resource
          </button>
        )}
      </div>

      {resources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text3)', fontSize: '13.5px' }}>
          No resources pinned yet. {canManage && 'Click "+ Add Resource" to share Figma files, docs, or demo links.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {resources.map((res) => {
            const icon = CATEGORY_ICONS[res.category] || CATEGORY_ICONS.General
            return (
              <div
                key={res._id}
                style={{
                  background: 'var(--navy2)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '18px' }}>{icon}</span>
                    <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '12px', background: 'var(--glass)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
                      {res.category}
                    </span>
                  </div>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--text)',
                      textDecoration: 'none',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent2)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}
                  >
                    {res.title} ↗
                  </a>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text3)', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  <span>{res.addedBy?.name ? `by ${res.addedBy.name}` : ''}</span>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(res._id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '11px', padding: 0 }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-2)', border: '1px solid var(--glass-border)',
            borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '420px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Pin New Resource</h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Title</label>
                <input
                  type="text"
                  placeholder="e.g. Figma Design File"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    background: 'var(--card)', border: '1px solid var(--border)',
                    color: 'var(--text)', fontSize: '14px', outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                  required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    background: 'var(--card)', border: '1px solid var(--border)',
                    color: 'var(--text)', fontSize: '14px', outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    background: 'var(--card)', border: '1px solid var(--border)',
                    color: 'var(--text)', fontSize: '14px', outline: 'none'
                  }}
                >
                  <option value="General">🔗 General</option>
                  <option value="Figma">🎨 Figma</option>
                  <option value="GitHub">💻 GitHub</option>
                  <option value="Notion">📝 Notion</option>
                  <option value="Drive">📁 Google Drive</option>
                  <option value="Demo">🚀 Live Demo</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 18px', borderRadius: '10px', border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--text2)', fontSize: '13.5px', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 22px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #6c63ff, #22d3a5)', color: 'white',
                    fontSize: '13.5px', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  {loading ? 'Adding...' : 'Save Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

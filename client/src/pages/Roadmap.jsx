import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Card from '../components/Card'

export default function Roadmap() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [collapsedWeeks, setCollapsedWeeks] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projRes = await api.get(`/projects/${id}`)
        setProject(projRes.data)
        try {
          const roadmapRes = await api.get(`/roadmap/${id}`)
          setRoadmap(roadmapRes.data)
        } catch (err) {
          if (err.response?.status !== 404) {
            setError(err.response?.data?.msg || 'Failed to load roadmap')
          }
          // 404 means no roadmap yet — that's fine
        }
      } catch (err) {
        setError('Failed to load project')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const isOwner = project?.owner._id === user?._id
  const isMember = project?.members.some(m => m._id === user?._id)

  const generateRoadmap = async (confirm = false) => {
    if (roadmap && !confirm) {
      if (!window.confirm('Regenerating the roadmap will reset all task progress. Continue?')) return
    }
    setGenerating(true)
    setError('')
    try {
      const res = await api.post(`/roadmap/${id}/generate`)
      setRoadmap(res.data)
      setCollapsedWeeks({})
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to generate roadmap')
    } finally {
      setGenerating(false)
    }
  }

  const toggleTask = async (taskId) => {
    try {
      const res = await api.patch(`/roadmap/${id}/tasks/${taskId}`)
      setRoadmap(res.data)
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update task')
    }
  }

  const toggleWeek = (weekNum) => {
    setCollapsedWeeks(prev => ({ ...prev, [weekNum]: !prev[weekNum] }))
  }

  const getTotalStats = () => {
    if (!roadmap) return { total: 0, done: 0 }
    let total = 0, done = 0
    roadmap.weeks.forEach(w => {
      w.tasks.forEach(t => {
        total++
        if (t.done) done++
      })
    })
    return { total, done }
  }

  const getWeekStats = (week) => {
    const total = week.tasks.length
    const done = week.tasks.filter(t => t.done).length
    return { total, done }
  }

  const getDeadlineInfo = () => {
    if (!project?.deadline) return null
    const now = new Date()
    const end = new Date(project.deadline)
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { label: 'Overdue', color: 'var(--danger)' }
    if (diff <= 7) return { label: `${diff}d left`, color: '#f59e0b' }
    return { label: `${Math.ceil(diff / 7)}w left`, color: 'var(--success)' }
  }

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'

  const skillColors = ['#6c63ff', '#22d3a5', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899']
  const getSkillColor = (skill) => skillColors[skill?.charCodeAt(0) % skillColors.length] || '#6c63ff'

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text3)' }}>
      Loading roadmap...
    </div>
  )

  if (!project) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--danger)' }}>
      Project not found.
    </div>
  )

  const { total, done } = getTotalStats()
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0
  const deadline = getDeadlineInfo()

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <button onClick={() => navigate(`/projects/${id}`)} style={{
        background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
        fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0
      }}>← Back to Project</button>

      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '4px' }}>
              📋 Project Roadmap
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '15px' }}>{project.title}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {deadline && (
              <span style={{
                fontSize: '13px', padding: '5px 12px', borderRadius: '20px',
                background: 'rgba(245,158,11,0.1)', color: deadline.color,
                border: `1px solid ${deadline.color}40`
              }}>📅 {deadline.label}</span>
            )}
            {isOwner && (
              <button
                onClick={() => generateRoadmap(false)}
                disabled={generating}
                style={{
                  background: generating ? 'var(--border)' : 'linear-gradient(135deg, #6c63ff, #22d3a5)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  padding: '10px 20px', fontSize: '14px', fontWeight: '600',
                  cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif',
                  transition: 'opacity 0.2s', opacity: generating ? 0.7 : 1
                }}
              >
                {generating ? '⏳ Generating...' : roadmap ? '🔄 Regenerate' : '✨ Generate Roadmap'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: '16px', background: 'rgba(255,94,108,0.08)', border: '1px solid rgba(255,94,108,0.2)',
            borderRadius: '10px', padding: '12px 16px', color: 'var(--danger)', fontSize: '14px'
          }}>{error}</div>
        )}
      </div>

      {/* No roadmap yet */}
      {!roadmap && !generating && (
        <Card>
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🗺️</div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>No Roadmap Yet</h2>
            <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
              {isOwner
                ? 'Generate a week-by-week AI roadmap based on your project and team skills.'
                : 'The project owner hasn\'t generated a roadmap yet. Ask them to generate one from this page.'}
            </p>
            {isOwner && (
              <button
                onClick={() => generateRoadmap(true)}
                disabled={generating}
                style={{
                  background: 'linear-gradient(135deg, #6c63ff, #22d3a5)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  padding: '14px 32px', fontSize: '15px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'Syne, sans-serif'
                }}
              >
                ✨ Generate Roadmap
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Generating skeleton */}
      {generating && (
        <Card>
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }}>⚡</div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>AI is building your roadmap...</h2>
            <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Analysing your team skills and project description</p>
            <div style={{ marginTop: '24px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: '60%', borderRadius: '2px',
                background: 'linear-gradient(90deg, #6c63ff, #22d3a5)',
                animation: 'shimmer 1.5s ease-in-out infinite'
              }} />
            </div>
          </div>
        </Card>
      )}

      {/* Roadmap content */}
      {roadmap && !generating && (
        <>
          {/* Overall progress */}
          <Card style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Overall Progress</p>
                <p style={{ fontSize: '13px', color: 'var(--text3)' }}>{done} of {total} tasks completed</p>
              </div>
              <div style={{
                fontSize: '32px', fontWeight: '800', fontFamily: 'Syne, sans-serif',
                color: progressPct >= 100 ? 'var(--success)' : progressPct >= 50 ? 'var(--accent2)' : 'var(--text2)'
              }}>
                {progressPct}%
              </div>
            </div>
            <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '4px',
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #6c63ff, #22d3a5)',
                transition: 'width 0.6s ease'
              }} />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px' }}>
              Generated {new Date(roadmap.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </Card>

          {/* Week cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {roadmap.weeks.map(week => {
              const { total: wTotal, done: wDone } = getWeekStats(week)
              const wPct = wTotal > 0 ? Math.round((wDone / wTotal) * 100) : 0
              const collapsed = collapsedWeeks[week.week]
              const allDone = wDone === wTotal

              return (
                <div key={week.week} style={{
                  background: 'var(--card)', border: `1px solid ${allDone ? 'rgba(34,211,165,0.3)' : 'var(--border)'}`,
                  borderRadius: '16px', overflow: 'hidden',
                  transition: 'border-color 0.3s'
                }}>
                  {/* Week header */}
                  <button
                    onClick={() => toggleWeek(week.week)}
                    style={{
                      width: '100%', background: allDone ? 'rgba(34,211,165,0.05)' : 'transparent',
                      border: 'none', padding: '18px 22px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                        background: allDone ? 'rgba(34,211,165,0.15)' : 'rgba(108,99,255,0.12)',
                        border: `1px solid ${allDone ? 'rgba(34,211,165,0.3)' : 'rgba(108,99,255,0.25)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: '800', color: allDone ? 'var(--success)' : 'var(--accent2)',
                        fontFamily: 'Syne, sans-serif'
                      }}>
                        {allDone ? '✓' : `W${week.week}`}
                      </div>
                      <div style={{ textAlign: 'left', minWidth: 0 }}>
                        <p style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {week.title}
                        </p>
                        {week.milestone && (
                          <span style={{
                            fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                            background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                            border: '1px solid rgba(245,158,11,0.2)'
                          }}>
                            🏁 {week.milestone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: allDone ? 'var(--success)' : 'var(--text2)' }}>
                          {wDone}/{wTotal}
                        </div>
                        <div style={{ width: '60px', height: '4px', background: 'var(--border)', borderRadius: '2px', marginTop: '4px' }}>
                          <div style={{ height: '100%', width: `${wPct}%`, borderRadius: '2px', background: allDone ? 'var(--success)' : '#6c63ff', transition: 'width 0.4s' }} />
                        </div>
                      </div>
                      <span style={{ color: 'var(--text3)', fontSize: '12px', transition: 'transform 0.2s', display: 'inline-block', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
                    </div>
                  </button>

                  {/* Tasks */}
                  {!collapsed && (
                    <div style={{ padding: '0 22px 18px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {week.tasks.map(task => (
                          <div
                            key={task._id}
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: '12px',
                              padding: '12px 14px', borderRadius: '10px',
                              background: task.done ? 'rgba(34,211,165,0.06)' : 'var(--navy3)',
                              border: `1px solid ${task.done ? 'rgba(34,211,165,0.2)' : 'var(--border)'}`,
                              transition: 'all 0.25s'
                            }}
                          >
                            {/* Checkbox */}
                            <button
                              onClick={() => toggleTask(task._id)}
                              disabled={!isMember && !isOwner}
                              style={{
                                width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                                border: `2px solid ${task.done ? 'var(--success)' : 'var(--border)'}`,
                                background: task.done ? 'var(--success)' : 'transparent',
                                cursor: (isMember || isOwner) ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s', marginTop: '1px'
                              }}
                            >
                              {task.done && <span style={{ color: 'white', fontSize: '11px', fontWeight: '700' }}>✓</span>}
                            </button>

                            {/* Task content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                fontWeight: '600', fontSize: '14px', marginBottom: '3px',
                                color: task.done ? 'var(--text3)' : 'var(--text)',
                                textDecoration: task.done ? 'line-through' : 'none',
                                transition: 'all 0.2s'
                              }}>
                                {task.title}
                              </p>
                              {task.description && (
                                <p style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.5, marginBottom: '8px' }}>
                                  {task.description}
                                </p>
                              )}
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                {task.assigneeName && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text2)' }}>
                                    <span style={{
                                      width: '20px', height: '20px', borderRadius: '50%',
                                      background: 'var(--accent2)', display: 'inline-flex',
                                      alignItems: 'center', justifyContent: 'center',
                                      fontSize: '9px', fontWeight: '700', color: 'white', flexShrink: 0
                                    }}>
                                      {getInitials(task.assigneeName)}
                                    </span>
                                    {task.assigneeName}
                                  </span>
                                )}
                                {task.skill && (
                                  <span style={{
                                    fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                                    background: `${getSkillColor(task.skill)}18`,
                                    color: getSkillColor(task.skill),
                                    border: `1px solid ${getSkillColor(task.skill)}30`
                                  }}>
                                    {task.skill}
                                  </span>
                                )}
                                {task.done && task.completedBy && (
                                  <span style={{ fontSize: '11px', color: 'var(--success)' }}>
                                    ✓ done by {task.completedBy}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

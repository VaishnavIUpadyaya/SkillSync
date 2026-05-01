import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api'
import Card from '../components/Card'

export default function VerifySkill() {
  const navigate = useNavigate()
  const location = useLocation()
  const { skill, proficiency } = location.state || {}

  const [step, setStep] = useState('start')
  const [challenge, setChallenge] = useState(null)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const levelLabel = ['', 'Beginner', 'Familiar', 'Intermediate', 'Advanced', 'Expert'][proficiency] || ''

  const generateChallenge = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/verify/challenge', { skill, proficiency })
      setChallenge(res.data)
      setStep('challenge')
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to generate challenge. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!answer.trim() || answer.trim().length < 10) {
      setError('Please write a more detailed answer')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/verify/evaluate', {
        skill, proficiency,
        question: challenge.question,
        answer,
        expectedTopics: challenge.expectedTopics
      })
      setResult(res.data)
      setStep('result')
    } catch (err) {
      setError(err.response?.data?.msg || 'Evaluation failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!skill) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text3)' }}>
      No skill selected. <button onClick={() => navigate('/profile')} style={{ color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px' }}>Go to Profile</button>
    </div>
  )

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 24px' }}>
      <button onClick={() => navigate('/profile')} style={{
        background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
        fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0
      }}>← Back to Profile</button>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Verify Skill</h1>
        <p style={{ color: 'var(--text2)', marginTop: '4px', fontSize: '15px' }}>
          Prove your <span style={{ color: 'var(--accent2)', fontWeight: '600' }}>{skill}</span> knowledge at <span style={{ color: 'var(--accent2)', fontWeight: '600' }}>{levelLabel}</span> level
        </p>
      </div>

      {step === 'start' && (
        <Card>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>Ready to verify {skill}?</h2>
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '8px', lineHeight: 1.6 }}>
              You'll be given a short challenge based on your claimed level.
            </p>
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
              Answer in your own words — no running code needed. If you pass, your skill gets a verified badge and ranks higher in project matches.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
              {['Answer in plain text', 'Takes 2-3 minutes', 'AI evaluated'].map((item, i) => (
                <span key={i} style={{
                  fontSize: '12px', padding: '4px 12px', borderRadius: '20px',
                  background: 'rgba(108,99,255,0.12)', color: 'var(--accent2)',
                  border: '1px solid rgba(108,99,255,0.25)'
                }}>✓ {item}</span>
              ))}
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
            <button onClick={generateChallenge} disabled={loading} style={{
              background: loading ? 'var(--border)' : 'var(--accent)',
              color: 'white', border: 'none', borderRadius: '10px',
              padding: '12px 32px', fontSize: '15px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif'
            }}>
              {loading ? 'Generating challenge...' : 'Start Challenge'}
            </button>
          </div>
        </Card>
      )}

      {step === 'challenge' && challenge && (
        <Card>
          <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--navy3)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Challenge</p>
            <p style={{ fontSize: '15px', color: 'var(--text)', lineHeight: 1.7 }}>{challenge.question}</p>
          </div>

          <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(245,158,11,0.08)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p style={{ fontSize: '12px', color: '#f59e0b' }}>💡 Hint: {challenge.hint}</p>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '8px', display: 'block' }}>Your Answer</label>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Write your answer here. Explain your understanding clearly..."
              style={{
                width: '100%', minHeight: '160px', background: 'var(--navy3)',
                border: '1px solid var(--border)', borderRadius: '10px',
                padding: '12px 14px', color: 'var(--text)', fontSize: '14px',
                resize: 'vertical', outline: 'none', fontFamily: 'DM Sans, sans-serif',
                lineHeight: 1.6, boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <p style={{ fontSize: '12px', color: answer.length > 50 ? 'var(--success)' : 'var(--text3)', marginTop: '4px' }}>
              {answer.length} characters {answer.length < 50 ? '— write more for better evaluation' : '— good length'}
            </p>
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={submitAnswer} disabled={loading} style={{
              background: loading ? 'var(--border)' : 'var(--accent)',
              color: 'white', border: 'none', borderRadius: '10px',
              padding: '12px 24px', fontSize: '14px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif'
            }}>
              {loading ? 'Evaluating...' : 'Submit Answer'}
            </button>
            <button onClick={() => { setStep('start'); setAnswer(''); setError('') }} style={{
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text2)', borderRadius: '10px', padding: '12px 24px',
              fontSize: '14px', cursor: 'pointer'
            }}>Cancel</button>
          </div>
        </Card>
      )}

      {step === 'result' && result && (
        <Card>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>
              {result.passed ? '🎉' : '📚'}
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px', color: result.passed ? 'var(--success)' : 'var(--danger)' }}>
              {result.passed ? 'Skill Verified!' : 'Not Quite Yet'}
            </h2>
            <div style={{ fontSize: '36px', fontWeight: '800', fontFamily: 'Syne, sans-serif', color: result.passed ? 'var(--success)' : '#f59e0b' }}>
              {result.score}/100
            </div>
            <div style={{ width: '200px', height: '6px', background: 'var(--border)', borderRadius: '3px', margin: '12px auto' }}>
              <div style={{
                height: '100%', borderRadius: '3px',
                width: `${result.score}%`,
                background: result.score >= 70 ? 'var(--success)' : result.score >= 40 ? '#f59e0b' : 'var(--danger)',
                transition: 'width 0.8s ease'
              }} />
            </div>
          </div>

          <div style={{ padding: '16px', background: 'var(--navy3)', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Feedback</p>
            <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.6 }}>{result.feedback}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {result.strongPoints?.length > 0 && (
              <div style={{ padding: '14px', background: 'rgba(34,211,165,0.08)', borderRadius: '10px', border: '1px solid rgba(34,211,165,0.2)' }}>
                <p style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '600', marginBottom: '8px' }}>✓ Strong Points</p>
                {result.strongPoints.map((p, i) => (
                  <p key={i} style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>• {p}</p>
                ))}
              </div>
            )}
            {result.improvements?.length > 0 && (
              <div style={{ padding: '14px', background: 'rgba(245,158,11,0.08)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                <p style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600', marginBottom: '8px' }}>📈 Improve On</p>
                {result.improvements.map((p, i) => (
                  <p key={i} style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>• {p}</p>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {result.passed ? (
              <button onClick={() => navigate('/profile')} style={{
                background: 'var(--success)', color: 'white', border: 'none',
                borderRadius: '10px', padding: '12px 24px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif'
              }}>View My Profile</button>
            ) : (
              <button onClick={() => { setStep('start'); setAnswer(''); setResult(null) }} style={{
                background: 'var(--accent)', color: 'white', border: 'none',
                borderRadius: '10px', padding: '12px 24px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif'
              }}>Try Again</button>
            )}
            <button onClick={() => navigate('/profile')} style={{
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text2)', borderRadius: '10px', padding: '12px 24px',
              fontSize: '14px', cursor: 'pointer'
            }}>Back to Profile</button>
          </div>
        </Card>
      )}
    </div>
  )
}
import { useCallback, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Card from '../components/Card'

const QUESTION_COUNT = 5

export default function VerifySkill() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser } = useAuth()
  const { skill, proficiency } = location.state || {}

  const [step, setStep] = useState('start')
  const [quiz, setQuiz] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndexes, setSelectedIndexes] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [canRetry, setCanRetry] = useState(true)

  const levelLabel = ['', 'Beginner', 'Familiar', 'Intermediate', 'Advanced', 'Expert'][proficiency] || ''

  const loadQuiz = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/verify/challenge', { skill, proficiency })
      const payload = res.data
      setQuiz(payload.quiz)
      setCanRetry(payload.canRetry)
      setStep('challenge')
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to generate quiz. Try again.')
    } finally {
      setLoading(false)
    }
  }, [skill, proficiency])

  const handleOptionSelect = (optionIndex) => {
    if (feedback) return
    const nextSelections = [...selectedIndexes]
    nextSelections[currentIndex] = optionIndex
    setSelectedIndexes(nextSelections)

    const currentQuestion = quiz?.questions?.[currentIndex]
    const isCorrect = optionIndex === currentQuestion?.correctIndex
    setFeedback({
      isCorrect,
      explanation: currentQuestion?.explanation || 'Review the topic and try again.'
    })
  }

  const goToNext = () => {
    if (currentIndex >= QUESTION_COUNT - 1) {
      submitAnswers()
      return
    }

    setCurrentIndex((prev) => prev + 1)
    setFeedback(null)
  }

  const submitAnswers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/verify/evaluate', {
        skill,
        proficiency,
        selectedIndexes,
        quiz
      })
      const evaluation = res.data
      setResult(evaluation)
      setCanRetry(evaluation.passed || false)
      if (evaluation.passed) {
        try {
          const updated = await api.get('/users/me')
          setUser(updated.data)
        } catch (err) {
          console.error('Failed to refresh user after verification:', err)
        }
      }
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

  const currentQuestion = quiz?.questions?.[currentIndex]
  const progressPercent = ((currentIndex + (feedback ? 1 : 0)) / QUESTION_COUNT) * 100

  return (
    <div className="page-container" style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px' }}>
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
              You will answer 5 multiple-choice questions tailored to your claimed level.
            </p>
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
              A passing score unlocks the verified badge, and failed attempts enter a short cooldown to keep verification meaningful.
            </p>
            {error && <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
            <button onClick={loadQuiz} disabled={loading} style={{
              background: loading ? 'var(--border)' : 'var(--accent3)',
              color: 'white', border: 'none', borderRadius: '10px',
              padding: '12px 32px', fontSize: '15px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif'
            }}>
              {loading ? 'Loading quiz...' : 'Start Quiz'}
            </button>
          </div>
        </Card>
      )}

      {step === 'challenge' && quiz && (
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Question {currentIndex + 1} of {QUESTION_COUNT}</p>
              <p style={{ fontSize: '12px', color: 'var(--text2)' }}>{Math.round(progressPercent)}%</p>
            </div>
            <div style={{ height: '6px', background: 'var(--border)', borderRadius: '999px' }}>
              <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--accent3)', borderRadius: '999px', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          <div style={{ marginBottom: '20px', padding: '18px', background: 'var(--navy3)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '15px', color: 'var(--text)', lineHeight: 1.7 }}>{currentQuestion?.question}</p>
          </div>

          <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
            {currentQuestion?.options?.map((option, index) => {
              const selected = selectedIndexes[currentIndex] === index
              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  disabled={Boolean(feedback)}
                  style={{
                    textAlign: 'left', borderRadius: '10px', padding: '12px 14px', border: selected ? '1px solid var(--accent3)' : '1px solid var(--border)',
                    background: selected ? 'rgba(108,99,255,0.12)' : 'var(--navy3)', color: 'var(--text)', cursor: feedback ? 'default' : 'pointer', fontSize: '14px'
                  }}
                >
                  <span style={{ fontWeight: 700, marginRight: '8px' }}>{String.fromCharCode(65 + index)}.</span>{option}
                </button>
              )
            })}
          </div>

          {feedback && (
            <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', background: feedback.isCorrect ? 'rgba(34,211,165,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${feedback.isCorrect ? 'rgba(34,211,165,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
              <p style={{ fontSize: '13px', color: feedback.isCorrect ? 'var(--success)' : '#f59e0b', fontWeight: '700', marginBottom: '4px' }}>
                {feedback.isCorrect ? 'Correct' : 'Not quite'}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>{feedback.explanation}</p>
            </div>
          )}

          {error && <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={goToNext} disabled={!feedback || loading} style={{
              background: !feedback || loading ? 'var(--border)' : 'var(--accent3)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: !feedback || loading ? 'not-allowed' : 'pointer'
            }}>
              {currentIndex === QUESTION_COUNT - 1 ? (loading ? 'Submitting...' : 'Finish Quiz') : 'Next Question'}
            </button>
            <button onClick={() => { setStep('start'); setQuiz(null); setCurrentIndex(0); setSelectedIndexes([]); setFeedback(null); setResult(null); setError('') }} style={{
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', cursor: 'pointer'
            }}>Restart</button>
          </div>
        </Card>
      )}

      {step === 'result' && result && (
        <Card>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>{result.passed ? '🎉' : '📚'}</div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px', color: result.passed ? 'var(--success)' : 'var(--danger)' }}>
              {result.passed ? 'Skill Verified!' : 'Not Quite Yet'}
            </h2>
            <div style={{ fontSize: '36px', fontWeight: '800', fontFamily: 'Syne, sans-serif', color: result.passed ? 'var(--success)' : '#f59e0b' }}>{result.score}/100</div>
            <div style={{ width: '200px', height: '6px', background: 'var(--border)', borderRadius: '3px', margin: '12px auto' }}>
              <div style={{ height: '100%', borderRadius: '3px', width: `${result.score}%`, background: result.score >= 70 ? 'var(--success)' : result.score >= 40 ? '#f59e0b' : 'var(--danger)', transition: 'width 0.8s ease' }} />
            </div>
          </div>

          <div style={{ padding: '16px', background: 'var(--navy3)', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Feedback</p>
            <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.6 }}>{result.feedback}</p>
          </div>

          <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
            {result.results?.map((item, index) => (
              <div key={index} style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--navy3)' }}>
                <p style={{ fontSize: '13px', marginBottom: '6px', color: item.isCorrect ? 'var(--success)' : '#f59e0b', fontWeight: '700' }}>{item.isCorrect ? '✓' : '•'} {item.question}</p>
                <p style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 }}>{item.explanation}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {result.passed ? (
              <button onClick={() => navigate('/profile')} style={{ background: 'var(--success)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>View My Profile</button>
            ) : (
              <button onClick={() => { if (canRetry) { setStep('start'); setQuiz(null); setCurrentIndex(0); setSelectedIndexes([]); setFeedback(null); setResult(null); setError('') } else { setError('Please wait before trying again.') } }} style={{ background: canRetry ? 'var(--accent)' : 'var(--border)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: canRetry ? 'pointer' : 'not-allowed' }}>
                {canRetry ? 'Try Again' : 'Retry Cooldown'}
              </button>
            )}
            <button onClick={() => navigate('/profile')} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', cursor: 'pointer' }}>Back to Profile</button>
          </div>
        </Card>
      )}
    </div>
  )
}
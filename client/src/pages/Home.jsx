import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, useInView } from 'framer-motion'
import Card from '../components/Card'
import GridMotion from '../components/GridMotion'

const heroLines = [
  ['Sync', 'your', 'skills'],
  ['Build', 'the', 'future.']
]

const marqueeSkills = ['React', 'Python', 'Node.js', 'MongoDB', 'UI/UX', 'ML/AI', 'DevOps']

const gridItems = [
  // Row 1
  <div className="grid-card grid-card-user">
    <div className="grid-avatar glow-orange">JD</div>
    <div className="grid-details">
      <h5>Jane Doe</h5>
      <span className="role">UX Designer</span>
    </div>
  </div>,
  <div className="grid-card grid-card-tech">
    <span className="icon">⚛️</span>
    <span className="name">React</span>
  </div>,
  <div className="grid-card grid-card-project">
    <h5>EduChain</h5>
    <span className="status assembling">Matching...</span>
  </div>,
  <div className="grid-card grid-card-tech">
    <span className="icon">🐍</span>
    <span className="name">Python</span>
  </div>,
  <div className="grid-card grid-card-user">
    <div className="grid-avatar glow-green">AC</div>
    <div className="grid-details">
      <h5>Alex Chen</h5>
      <span className="role">ML Engineer</span>
    </div>
  </div>,
  <div className="grid-card grid-card-project">
    <h5>EcoSync</h5>
    <span className="match-pill">98% Match</span>
  </div>,
  <div className="grid-card grid-card-tech">
    <span className="icon">🎨</span>
    <span className="name">Figma</span>
  </div>,

  // Row 2
  <div className="grid-card grid-card-tech">
    <span className="icon">🟢</span>
    <span className="name">Node.js</span>
  </div>,
  <div className="grid-card grid-card-user">
    <div className="grid-avatar glow-purple">SM</div>
    <div className="grid-details">
      <h5>Sarah M.</h5>
      <span className="role">Frontend Dev</span>
    </div>
  </div>,
  <div className="grid-card grid-card-project">
    <h5>FinFlow</h5>
    <span className="match-pill">94% Match</span>
  </div>,
  <div className="grid-card grid-card-tech">
    <span className="icon">🔷</span>
    <span className="name">TypeScript</span>
  </div>,
  <div className="grid-card grid-card-user">
    <div className="grid-avatar glow-blue">KJ</div>
    <div className="grid-details">
      <h5>Kabir J.</h5>
      <span className="role">DevOps Engineer</span>
    </div>
  </div>,
  <div className="grid-card grid-card-project">
    <h5>HealthAI</h5>
    <span className="status active">Active</span>
  </div>,
  <div className="grid-card grid-card-tech">
    <span className="icon">🐳</span>
    <span className="name">Docker</span>
  </div>,

  // Row 3
  <div className="grid-card grid-card-user">
    <div className="grid-avatar glow-yellow">ER</div>
    <div className="grid-details">
      <h5>Elena R.</h5>
      <span className="role">Fullstack Lead</span>
    </div>
  </div>,
  <div className="grid-card grid-card-tech">
    <span className="icon">🔥</span>
    <span className="name">PyTorch</span>
  </div>,
  <div className="grid-card grid-card-project">
    <h5>AgroDrone</h5>
    <span className="status assembling">Matching...</span>
  </div>,
  <div className="grid-card grid-card-tech">
    <span className="icon">🐹</span>
    <span className="name">GoLang</span>
  </div>,
  <div className="grid-card grid-card-user">
    <div className="grid-avatar glow-pink">PK</div>
    <div className="grid-details">
      <h5>Priya K.</h5>
      <span className="role">Product Manager</span>
    </div>
  </div>,
  <div className="grid-card grid-card-project">
    <h5>CyberShield</h5>
    <span className="match-pill">96% Match</span>
  </div>,
  <div className="grid-card grid-card-tech">
    <span className="icon">☁️</span>
    <span className="name">AWS</span>
  </div>,

  // Row 4
  <div className="grid-card grid-card-tech">
    <span className="icon">🛡️</span>
    <span className="name">Solidity</span>
  </div>,
  <div className="grid-card grid-card-user">
    <div className="grid-avatar glow-cyan">YT</div>
    <div className="grid-details">
      <h5>Yuki T.</h5>
      <span className="role">Backend Dev</span>
    </div>
  </div>,
  <div className="grid-card grid-card-project">
    <h5>MetaSpace</h5>
    <span className="status active">Active</span>
  </div>,
  <div className="grid-card grid-card-tech">
    <span className="icon">⚙️</span>
    <span className="name">Rust</span>
  </div>,
  <div className="grid-card grid-card-user">
    <div className="grid-avatar glow-teal">DS</div>
    <div className="grid-details">
      <h5>Dan S.</h5>
      <span className="role">Security Lead</span>
    </div>
  </div>,
  <div className="grid-card grid-card-project">
    <h5>FoodApp</h5>
    <span className="match-pill">91% Match</span>
  </div>,
  <div className="grid-card grid-card-tech">
    <span className="icon">🤖</span>
    <span className="name">OpenAI API</span>
  </div>
]

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const statsRef = useRef(null)
  const statsInView = useInView(statsRef, { once: true, amount: 0.35 })
  const [stats, setStats] = useState({ projects: 0, verified: 0, rate: 0 })
  const animationRef = useRef(null)

  useEffect(() => {
    if (!statsInView) return
    const targets = { projects: 1480, verified: 380, rate: 98 }
    const duration = 1200
    const start = performance.now()

    const animate = (timestamp) => {
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      const ease = progress * (2 - progress)

      setStats({
        projects: Math.floor(ease * targets.projects),
        verified: Math.floor(ease * targets.verified),
        rate: Math.floor(ease * targets.rate)
      })

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [statsInView])

  const handleSpotlightMove = (event) => {
    const card = event.currentTarget
    const rect = card.getBoundingClientRect()
    const px = ((event.clientX - rect.left) / rect.width) * 100
    const py = ((event.clientY - rect.top) / rect.height) * 100
    card.style.setProperty('--pointer-x', `${px}%`)
    card.style.setProperty('--pointer-y', `${py}%`)
  }

  const handleSpotlightReset = (event) => {
    const card = event.currentTarget
    card.style.setProperty('--pointer-x', '50%')
    card.style.setProperty('--pointer-y', '50%')
  }

  return (
    <div className="page-container home-redesign">
      
      <section className="landing-hero-fullscreen">
        <div className="hero-bg-layer">
          <GridMotion items={gridItems} gradientColor="rgba(82, 39, 255, 0.03)" />
          <div className="hero-radial-mask" />
        </div>

        <div className="hero-content-overlay">
          <div className="hero-copy">
            
            <motion.h1
              className="hero-title"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } }
              }}
            >
              {heroLines.map((line, lineIndex) => (
                <span key={lineIndex} className="hero-title-line">
                  {line.map((word, wordIndex) => (
                    <motion.span
                      key={`${word}-${wordIndex}`}
                      className="hero-word"
                      variants={{
                        hidden: { opacity: 0, y: 18, filter: 'blur(16px)' },
                        visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: [0.25, 0.8, 0.25, 1] } }
                      }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </span>
              ))}
            </motion.h1>

            <p className="hero-subtitle">
              SkillSync blends intelligent team matching, verified skill signals, and project roadmaps into a polished commercial-grade onboarding experience.
            </p>

            <div className="hero-actions">
              {user ? (
                <Link to="/dashboard" className="hero-cta hero-cta--primary hero-cta--shiny">Go to Dashboard</Link>
              ) : (
                <>
                  <Link to="/register" className="hero-cta hero-cta--primary hero-cta--shiny">Get Started</Link>
                  <Link to="/login" className="hero-cta hero-cta--secondary">Sign In</Link>
                </>
              )}
            </div>

            <div className="hero-stat-grid" ref={statsRef}>
              <div className="hero-stat-card">
                <span>{stats.projects}+</span>
                <p>Collaborative projects launched</p>
              </div>
              <div className="hero-stat-card">
                <span>{stats.verified}+</span>
                <p>AI-verified endorsements</p>
              </div>
              <div className="hero-stat-card">
                <span>{stats.rate}%</span>
                <p>Team match accuracy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '0 20px 80px' }}>
        <section className="marquee-strip" aria-label="Featured skills">
          <div className="marquee-track">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="marquee-segment">
                {marqueeSkills.map((skill) => `${skill} · `)}
              </div>
            ))}
          </div>
        </section>

        <section className="feature-summary-grid">
          <Card
            onMouseMove={handleSpotlightMove}
            onMouseLeave={handleSpotlightReset}
          >
            <div className="feature-icon">🧠</div>
            <h3>Intelligent Matchmaker</h3>
            <p>Find collaborations based on real skill gaps. Our algorithm analyzes project profiles to match developers with complementary requirements.</p>
          </Card>
          <Card
            onMouseMove={handleSpotlightMove}
            onMouseLeave={handleSpotlightReset}
          >
            <div className="feature-icon">🛡️</div>
            <h3>AI-Driven Evaluations</h3>
            <p>Take interactive AI challenge assessments. Pass verification tests to receive public badges that highlight you to recruiters.</p>
          </Card>
          <Card
            onMouseMove={handleSpotlightMove}
            onMouseLeave={handleSpotlightReset}
          >
            <div className="feature-icon">📋</div>
            <h3>Auto Roadmaps</h3>
            <p>Generate step-by-step milestones. The AI tracks team profiles and deadlines to outline actionable task schedules.</p>
          </Card>
        </section>

        <section className="cta-banner ripple-banner">
          <div>
            <h2>Ready to launch your next team?</h2>
            <p>Register your profile, share your verified skills, and connect with high-fit collaborators in minutes.</p>
            <button onClick={() => navigate('/register')} className="hero-cta hero-cta--primary hero-cta--shiny">Create Free Account</button>
          </div>
        </section>
      </div>
    </div>
  )
}

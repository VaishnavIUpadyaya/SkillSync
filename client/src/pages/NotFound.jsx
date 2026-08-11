import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '40px 20px'
    }}>
      <h1 style={{ fontSize: '72px', fontWeight: '900', color: 'var(--accent3)', margin: 0 }}>404</h1>
      <h2 style={{ fontSize: '24px', margin: '16px 0 8px', color: 'var(--text)' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text3)', maxWidth: '400px', marginBottom: '24px' }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary">
        Return Home
      </Link>
    </div>
  )
}

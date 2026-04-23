export default function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '24px',
      ...style
    }}>
      {children}
    </div>
  )
}
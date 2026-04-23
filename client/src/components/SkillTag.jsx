export default function SkillTag({ name, proficiency, size = 'md' }) {
  const small = size === 'sm'
  return (
    <span style={{
      background: 'rgba(108,99,255,0.12)',
      border: '1px solid rgba(108,99,255,0.25)',
      color: 'var(--accent2)',
      padding: small ? '2px 8px' : '4px 10px',
      borderRadius: '6px',
      fontSize: small ? '11px' : '12px',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      whiteSpace: 'nowrap',
    }}>
      {name}
      {proficiency && (
        <span style={{ color: 'var(--text3)', fontSize: '11px' }}>{proficiency}/5</span>
      )}
    </span>
  )
}
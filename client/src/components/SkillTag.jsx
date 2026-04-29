export default function SkillTag({ name, proficiency, size = 'md' }) {
  const small = size === 'sm'

  const levelLabel = (p) => {
    if (p === 1) return 'Beginner'
    if (p === 2) return 'Familiar'
    if (p === 3) return 'Intermediate'
    if (p === 4) return 'Advanced'
    if (p === 5) return 'Expert'
    return ''
  }

  const levelColor = (p) => {
    if (p === 1) return '#ef4444'
    if (p === 2) return '#f97316'
    if (p === 3) return '#f59e0b'
    if (p === 4) return '#22c55e'
    if (p === 5) return '#6c63ff'
    return 'var(--text3)'
  }

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
      gap: '6px',
      whiteSpace: 'nowrap',
    }}>
      {name}
      {proficiency && (
        <span style={{
          fontSize: '10px',
          color: levelColor(proficiency),
          fontWeight: '600',
          background: `${levelColor(proficiency)}18`,
          padding: '1px 5px',
          borderRadius: '4px'
        }}>
          {levelLabel(proficiency)}
        </span>
      )}
    </span>
  )
}
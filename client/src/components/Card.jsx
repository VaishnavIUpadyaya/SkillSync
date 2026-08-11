import { useEffect, useRef } from 'react'

export default function Card({ children, style = {}, className = '', onClick, ...props }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.unobserve(el) } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`glass-card reveal ${className}`}
      style={{ padding: 'clamp(16px, 4vw, 24px)', ...style }}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}
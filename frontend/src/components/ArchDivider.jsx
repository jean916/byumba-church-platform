// Signature visual element: a row of pointed arches referencing Anglican
// church windows, interlaced with a diamond motif drawn from Rwandan
// agaseke basket weaving - ties the church's tradition to its setting.
export default function ArchDivider({ color = 'var(--color-gold)' }) {
  return (
    <svg viewBox="0 0 800 40" width="100%" height="40" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: 20 }).map((_, i) => (
        <path
          key={i}
          d={`M ${i * 40} 40 L ${i * 40 + 20} 8 L ${i * 40 + 40} 40`}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          opacity="0.6"
        />
      ))}
    </svg>
  )
}

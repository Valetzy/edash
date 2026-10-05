export function StatCard({
  label,
  value,
  tone = 'default',
  sub,
}: {
  label: string
  value: string | number
  tone?: 'default' | 'retain' | 'risk' | 'shift'
  sub?: string
}) {
  const toneClass = {
    default: 'text-ink',
    retain: 'text-retain',
    risk: 'text-risk',
    shift: 'text-shift',
  }[tone]

  return (
    <div className="card">
      <p className="text-sm text-muted mb-1">{label}</p>
      <p className={`text-3xl font-serif ${toneClass}`}>{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  )
}

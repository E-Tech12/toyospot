export default function StatCard({ label, value, sublabel, tone = 'default' }) {
  const toneStyles = {
    default: 'text-ink',
    warn: 'text-warn',
    danger: 'text-danger',
    success: 'text-success'
  }
  return (
    <div className="bg-surface border border-border rounded-xl2 p-5">
      <p className="text-xs font-medium text-muted uppercase tracking-wide">{label}</p>
      <p className={`font-display text-2xl font-semibold mt-2 ${toneStyles[tone]}`}>{value}</p>
      {sublabel && <p className="text-xs text-muted mt-1">{sublabel}</p>}
    </div>
  )
}

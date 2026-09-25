export function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString('en-NG')}`
}

export function formatRelativeTime(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

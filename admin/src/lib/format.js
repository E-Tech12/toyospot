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

export const ORDER_STATUS_LABEL = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
}

export const PAYMENT_STATUS_LABEL = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded'
}

// What an order can move to next, mirroring the backend's allowed
// transitions in routers/admin_orders.py -- kept in sync manually since
// this is just UI guidance; the backend is still the source of truth and
// will reject anything invalid regardless of what buttons this renders.
export const NEXT_STATUSES = {
  pending: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
}

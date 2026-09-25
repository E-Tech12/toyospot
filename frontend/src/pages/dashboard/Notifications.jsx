import { useEffect, useState } from 'react'
import { formatRelativeTime } from '../../lib/format'
import { notificationApi } from '../../lib/endpoints'
import { getNotificationPermission, isPushSupported, subscribeToPush } from '../../lib/push'

function PushOptIn() {
  const [permission, setPermission] = useState(getNotificationPermission())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!isPushSupported() || permission === 'granted') return null

  const handleEnable = async () => {
    setBusy(true)
    setError('')
    try {
      await subscribeToPush()
      setPermission('granted')
    } catch (err) {
      setError(err.message || 'Could not enable notifications.')
    } finally {
      setBusy(false)
    }
  }

  if (permission === 'denied') {
    return (
      <div className="bg-cream border border-border rounded-xl2 p-4 mb-6 text-sm text-muted">
        Notifications are blocked for this site in your browser settings. Enable them there to get order updates even
        when Toyo&apos;s Pot isn&apos;t open.
      </div>
    )
  }

  return (
    <div className="bg-primary-light/50 border border-primary-light rounded-xl2 p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
      <p className="text-sm">Get notified the moment your order status changes, even with the app closed.</p>
      <div className="flex items-center gap-3 shrink-0">
        {error && <span className="text-xs text-danger">{error}</span>}
        <button
          onClick={handleEnable}
          disabled={busy}
          className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full disabled:opacity-60"
        >
          {busy ? 'Enabling...' : 'Enable notifications'}
        </button>
      </div>
    </div>
  )
}

export default function Notifications() {
  const [notifications, setNotifications] = useState(null)

  useEffect(() => {
    notificationApi.list().then(setNotifications).catch(() => setNotifications([]))
  }, [])

  const markAllRead = async () => {
    await notificationApi.markAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const markRead = async (id) => {
    await notificationApi.markRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  if (notifications === null) {
    return (
      <div className="max-w-2xl space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-border rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <PushOptIn />
      {notifications.length > 0 && (
        <div className="flex justify-end mb-4">
          <button onClick={markAllRead} className="text-sm font-medium text-primary">
            Mark all as read
          </button>
        </div>
      )}
      {notifications.length === 0 ? (
        <p className="text-sm text-muted py-10 text-center">No notifications yet.</p>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className="w-full text-left py-4 flex items-start gap-3"
            >
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-primary'}`} />
              <div>
                <p className={`text-sm ${n.is_read ? 'font-medium' : 'font-semibold'}`}>{n.title}</p>
                <p className="text-sm text-muted mt-0.5">{n.body}</p>
                <p className="text-xs text-muted/70 mt-1">{formatRelativeTime(n.created_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

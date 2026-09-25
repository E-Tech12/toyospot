import { pushApi } from './endpoints'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function getNotificationPermission() {
  return isPushSupported() ? Notification.permission : 'unsupported'
}

/**
 * Requests permission (if needed) and subscribes this browser to Web Push,
 * registering the subscription with the backend. Safe to call multiple
 * times -- re-subscribing with the same endpoint just updates the row.
 */
export async function subscribeToPush() {
  if (!isPushSupported()) throw new Error('Push notifications are not supported in this browser.')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not granted.')

  const registration = await navigator.serviceWorker.ready
  const { publicKey } = await pushApi.getVapidPublicKey()
  if (!publicKey) throw new Error('Push is not configured on the server yet.')

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    })
  }

  const json = subscription.toJSON()
  await pushApi.subscribe({
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth
  })

  return subscription
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  const json = subscription.toJSON()
  await subscription.unsubscribe()
  await pushApi.unsubscribe({
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth
  })
}

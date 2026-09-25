import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

self.skipWaiting()
clientsClaim()

// Injected by vite-plugin-pwa's injectManifest build step with the list of
// build assets to precache for offline/app-shell support.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ---------------- Web Push ----------------
// The backend sends a JSON payload shaped { title, body, url } (see
// app/services/push.py send_push_to_user on the backend) for every order
// status change, chat reply, and admin announcement.

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: "Toyo's Pot", body: event.data.text() }
  }

  const { title = "Toyo's Pot", body = '', url = '/' } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url }
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      return self.clients.openWindow(targetUrl)
    })
  )
})

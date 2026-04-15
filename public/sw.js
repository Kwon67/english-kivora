const CACHE_VERSION = 'kivora-v2'
const OFFLINE_URL = '/offline'
const STATIC_ASSETS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => undefined)
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key === CACHE_VERSION) return Promise.resolve()
            return caches.delete(key)
          })
        )
      ),
    ])
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy)).catch(() => undefined)
          return response
        })
        .catch(async () => {
          const cachedPage = await caches.match(request)
          if (cachedPage) return cachedPage

          const offlineResponse = await caches.match(OFFLINE_URL)
          return (
            offlineResponse ||
            new Response('Offline', {
              status: 503,
              statusText: 'Offline',
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          )
        })
    )
    return
  }

  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            const copy = response.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy)).catch(() => undefined)
            return response
          })
          .catch(() => cached)

        return cached || networkFetch
      })
    )
  }
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  const payload = event.data.json()
  const title = payload.title || 'Kivora English'
  const options = {
    body: payload.body || 'Sua revisão já venceu. Abra o app e retome o ritmo.',
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-192x192.png',
    data: {
      url: payload.url || '/review',
    },
    tag: payload.tag || 'due-review',
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/review'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }

      return undefined
    })
  )
})

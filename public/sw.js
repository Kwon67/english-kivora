const SW_VERSION = '2026-06-17-02'
const STATIC_CACHE = `kivora-static-${SW_VERSION}`
const RUNTIME_CACHE = `kivora-runtime-${SW_VERSION}`
const TTS_CACHE = `kivora-tts-${SW_VERSION}`
const OFFLINE_URL = '/offline'
const STATIC_MAX_ENTRIES = 120
const TTS_MAX_ENTRIES = 60

const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.svg',
]

function isSameOrigin(url) {
  return url.origin === self.location.origin
}

function isNextAsset(url) {
  return url.pathname.startsWith('/_next/')
}

function isStaticRequest(request, url) {
  if (isNextAsset(url)) return false
  if (['font', 'image', 'script', 'style', 'worker'].includes(request.destination)) return true
  return /\.(?:avif|css|ico|js|json|png|svg|wasm|webmanifest|webp)$/i.test(url.pathname)
}

function isCacheableResponse(response) {
  return response && response.ok && (response.type === 'basic' || response.type === 'cors')
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()

  if (keys.length <= maxEntries) return

  await Promise.all(keys.slice(0, keys.length - maxEntries).map((request) => cache.delete(request)))
}

async function staleWhileRevalidate(event, cacheName, maxEntries) {
  const cachedResponse = await caches.match(event.request)

  const fetchPromise = fetch(event.request)
    .then(async (response) => {
      if (isCacheableResponse(response)) {
        const cache = await caches.open(cacheName)
        await cache.put(event.request, response.clone())
        await trimCache(cacheName, maxEntries)
      }

      return response
    })

  event.waitUntil(fetchPromise.then(() => undefined).catch(() => undefined))

  if (cachedResponse) return cachedResponse

  return fetchPromise
}

async function cacheFirst(event, cacheName, maxEntries) {
  const cachedResponse = await caches.match(event.request)
  if (cachedResponse) return cachedResponse

  const response = await fetch(event.request)

  if (isCacheableResponse(response)) {
    const cache = await caches.open(cacheName)
    await cache.put(event.request, response.clone())
    await trimCache(cacheName, maxEntries)
  }

  return response
}

function notificationUrlFromData(data, action) {
  if (action === 'review') return '/review'

  const rawUrl = typeof data.url === 'string' ? data.url : '/home'

  try {
    const url = new URL(rawUrl, self.location.origin)
    return url.origin === self.location.origin ? `${url.pathname}${url.search}${url.hash}` : '/home'
  } catch {
    return '/home'
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      await Promise.allSettled(
        PRECACHE_URLS.map((url) => cache.add(url).catch(() => undefined))
      )
      self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('kivora-') && ![STATIC_CACHE, RUNTIME_CACHE, TTS_CACHE].includes(cacheName))
            .map((cacheName) => caches.delete(cacheName))
        )
      ),
      self.clients.claim(),
    ])
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (!isSameOrigin(url)) return
  if (isNextAsset(url)) return

  // Never intercept document navigations. Next.js + auth redirects break easily
  // when a service worker owns the HTML request (common Android PWA blank screen).
  if (request.mode === 'navigate') return

  if (url.pathname === '/api/tts/preview') {
    event.respondWith(cacheFirst(event, TTS_CACHE, TTS_MAX_ENTRIES))
    return
  }

  if (isStaticRequest(request, url)) {
    event.respondWith(staleWhileRevalidate(event, STATIC_CACHE, STATIC_MAX_ENTRIES))
    return
  }
})

self.addEventListener('push', (event) => {
  let data = {}

  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }

  const title = typeof data.title === 'string' ? data.title : 'Kivora Ingles'
  const body = typeof data.body === 'string' ? data.body : 'Sua revisão está pronta.'
  const tag = typeof data.tag === 'string' ? data.tag : 'kivora-review'
  const url = notificationUrlFromData(data)

  const notificationOptions = {
    body,
    tag,
    icon: typeof data.icon === 'string' ? data.icon : '/icon-192.png',
    badge: typeof data.badge === 'string' ? data.badge : '/icon-192.png',
    data: {
      url,
      receivedAt: Date.now(),
    },
  }

  if ('vibrate' in navigator) {
    notificationOptions.vibrate = [80, 35, 80]
  }

  if ('actions' in Notification.prototype) {
    notificationOptions.actions = [
      { action: 'open', title: 'Abrir' },
      { action: 'review', title: 'Revisar' },
    ]
  }

  event.waitUntil(self.registration.showNotification(title, notificationOptions))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = notificationUrlFromData(event.notification.data || {}, event.action)

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url)
        if (clientUrl.origin === self.location.origin && clientUrl.pathname === targetUrl) {
          return client.focus()
        }
      }

      return self.clients.openWindow(targetUrl)
    })
  )
})
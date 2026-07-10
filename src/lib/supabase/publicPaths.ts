const PUBLIC_ROUTE_PREFIXES = [
  '/register',
  '/forgot-password',
  '/privacy',
  '/terms',
  '/_next/',
  '/login',
  '/auth/',
  '/api/login',
  '/api/cron/',
  '/api/push/notify',
  '/api/webhooks/abacatepay',
  '/images/',
  '/offline',
  '/manifest.webmanifest',
  '/sw.js',
  '/apple-icon.png',
  '/icon.png',
  '/icon.svg',
  '/favicon.ico',
  '/file.svg',
  '/globe.svg',
  '/next.svg',
  '/vercel.svg',
  '/window.svg',
]

const PUBLIC_ASSET_PREFIXES = ['/pwa-']

export function isPublicRequestPath(pathname: string) {
  return (
    pathname === '/' ||
    PUBLIC_ASSET_PREFIXES.some((path) => pathname.startsWith(path)) ||
    PUBLIC_ROUTE_PREFIXES.some((path) => {
      if (path.endsWith('/')) return pathname.startsWith(path)
      return pathname === path || pathname.startsWith(`${path}/`)
    })
  )
}

import { NextResponse, type NextRequest } from 'next/server'
import { proxy as runSecurityProxy } from '@/lib/supabase/proxy'

const PUBLIC_MARKETING_PATHS = ['/demo']

function isPublicMarketingPath(pathname: string) {
  return PUBLIC_MARKETING_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}

export async function proxy(request: NextRequest) {
  if (/^\/audio\/kivora\/(?:[a-f0-9]{64}\.mp3|index\/[a-f0-9]{64}\.json)$/.test(request.nextUrl.pathname) || isPublicMarketingPath(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  return runSecurityProxy(request)
}

export const config = {
  matcher: [
    '/((?!$|_next/(?:static|image)(?:/|$)|(?:images|brand)(?:/|$)|(?:robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|favicon\\.(?:ico|svg)|icon\\.(?:svg|png)|apple-icon\\.png|apple-touch-icon\\.png|icon-(?:192|512)\\.png|pwa-(?:192x192|512x512)\\.png|notification-badge(?:-96\\.png|\\.svg)|(?:file|globe|next|vercel|window)\\.svg)$).*)',
  ],
}

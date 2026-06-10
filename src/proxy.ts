import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/session'

const PUBLIC_MARKETING_PATHS = ['/', '/demo', '/register', '/forgot-password']

function isPublicMarketingPath(pathname: string) {
  return PUBLIC_MARKETING_PATHS.some((path) => {
    if (path === '/') return pathname === '/'
    return pathname === path || pathname.startsWith(`${path}/`)
  })
}

export async function proxy(request: NextRequest) {
  if (isPublicMarketingPath(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

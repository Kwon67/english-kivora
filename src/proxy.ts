import { NextResponse, type NextRequest } from 'next/server'
import { proxy as runSecurityProxy } from '@/lib/supabase/proxy'

const PUBLIC_MARKETING_PATHS = ['/demo']

function isPublicMarketingPath(pathname: string) {
  return PUBLIC_MARKETING_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}

export async function proxy(request: NextRequest) {
  if (isPublicMarketingPath(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  return runSecurityProxy(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
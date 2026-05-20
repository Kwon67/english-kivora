import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'
import { isRateLimited } from '@/lib/security'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Enterprise Security: Edge Rate Limiting for sensitive endpoints
  if (pathname.startsWith('/api/login') || pathname.startsWith('/api/ai')) {
    const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
    
    const limited = await isRateLimited('api_edge', ip, 10, 60)
    if (limited) {
      return NextResponse.json(
        { error: 'Muitas requisições. Por favor, aguarde.' },
        { status: 429 }
      )
    }
  }

  // Use the proxy session handler for auth redirects
  return await updateSession(request)
}

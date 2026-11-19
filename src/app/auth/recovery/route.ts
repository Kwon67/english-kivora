import { NextRequest, NextResponse } from 'next/server'

export function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const hash = request.nextUrl.searchParams.get('token_hash')
  const recoveryHash = !code && request.nextUrl.searchParams.get('type') === 'recovery' && hash && /^[a-f0-9]{32,128}$/i.test(hash) ? hash : null
  const validCode = !!code && /^[a-zA-Z0-9_-]{1,256}$/.test(code) && request.cookies.has('kv-recovery-code-verifier')
  const ticket = recoveryHash ? 'hash:' + recoveryHash : validCode ? code : ''
  const destination = ticket ? '/auth/new-password' : '/auth/new-password?invalid=1'
  // Keep the host-only ticket on the origin that received the callback.
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: destination, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
  })
  response.cookies.set('kv-recovery-ticket', ticket, {
    path: '/auth/new-password', httpOnly: true, sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:', maxAge: ticket ? 600 : 0,
  })
  return response
}

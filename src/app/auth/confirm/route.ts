import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (code && code.length <= 256) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL('/onboarding', request.url), {
        headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
      })
    }
  }

  // The link can confirm the email even when the PKCE verifier is missing
  // (for example, when it was opened on another device). Login remains available.
  return NextResponse.redirect(new URL('/login?confirmation=check', request.url), {
    headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
  })
}

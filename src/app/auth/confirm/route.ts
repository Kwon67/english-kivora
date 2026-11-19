import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function redirectAfterConfirmation(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
  })
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (code && code.length <= 256) {
    const supabase = await createClient()
    const result = await supabase.auth.exchangeCodeForSession(code).catch(() => null)
    if (result && !result.error && result.data?.session) {
      return redirectAfterConfirmation('/onboarding')
    }
  }

  // The link can confirm the email even when the PKCE verifier is missing
  // (for example, when it was opened on another device). Login remains available.
  return redirectAfterConfirmation('/login?confirmation=check')
}

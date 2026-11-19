import { createServerClient } from '@supabase/ssr'
import { isAuthApiError } from '@supabase/auth-js'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/config'
import { readMfaState } from '@/features/auth/lib/readMfaState'
import { studyReturnPath } from '@/features/auth/lib/studyReturnPath'
import { resolveAuthenticatorAssuranceLevel } from '@/features/auth/lib/auth-assurance'
import { shouldRequireOnboarding } from '@/features/onboarding/lib/onboardingStatus'
import { isPublicRequestPath } from '@/lib/supabase/publicPaths'

const authCookieName = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`

type ClaimsResult = {
  error?: unknown
  data: { claims: { sub: string; aal?: unknown; amr?: unknown } & Record<string, unknown> } | null
}

type ProfileRoleResult = {
  data: { role: string | null } | null
  error: unknown | null
}

type OnboardingStatusResult = {
  data: { onboarding_completed_at: string | null } | null
  error: unknown | null
}

type OnboardingProfileResult = {
  data: { role: string | null; created_at: string | null } | null
  error: unknown | null
}

function clearAuthCookies(
  response: NextResponse,
  cookies: { name: string }[]
) {
  for (const { name } of cookies) {
    if (![authCookieName, 'supabase.auth.token'].some(base => name === base || name.startsWith(base + '.'))) continue

    response.cookies.set(name, '', {
      path: '/',
      maxAge: 0,
    })
  }
}

function isInvalidRefreshTokenError(error: unknown) {
  return isAuthApiError(error) && error.code === 'refresh_token_not_found'
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([promise, new Promise<T>(resolve => {
      timer = setTimeout(() => resolve(fallback), ms)
      timer.unref?.()
    })])
  } finally {
    clearTimeout(timer)
  }
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          const previous = supabaseResponse.cookies.getAll()
          supabaseResponse = NextResponse.next({ request })
          for (const cookie of previous) supabaseResponse.cookies.set(cookie)
          cookiesToSet.forEach(({ name, value, options }) => {
            const safeOptions = { ...options }
            if (process.env.NODE_ENV !== 'production') {
              safeOptions.secure = false
              safeOptions.sameSite = 'lax'
            }
            supabaseResponse.cookies.set(name, value, safeOptions)
          })
        },
      },
    }
  )

  // IMPORTANT: Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard
  // to debug issues with users being randomly logged out.
  const claimsResponse = await withTimeout<ClaimsResult>(
    supabase.auth.getClaims(), 4000, { data: null },
  ).catch((error: unknown) => ({ data: null, error }))

  const user = claimsResponse.data?.claims
  const currentLevel = resolveAuthenticatorAssuranceLevel(user)
  if (isInvalidRefreshTokenError(claimsResponse.error)) {
    clearAuthCookies(supabaseResponse, request.cookies.getAll())
  }

  // A redirect must deliver cookies rotated (or expired) during this same request.
  function withSessionCookies(response: NextResponse) {
    for (const cookie of supabaseResponse.cookies.getAll()) response.cookies.set(cookie)
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  }

  function redirectTo(path: string) {
    return withSessionCookies(NextResponse.redirect(new URL(path, request.url)))
  }

  // Public routes that don't require authentication
  const isPublicPath = isPublicRequestPath(pathname)
  const isMFAChallengePath = pathname === '/login/mfa' || pathname.startsWith('/login/mfa/')
  const studyDestination = studyReturnPath(pathname + request.nextUrl.search)
  const challengeUrl = studyDestination ? '/login/mfa?next=' + encodeURIComponent(studyDestination) : '/login/mfa'

  // MFA Enforcement: If user has factors but is only aal1, redirect to challenge
  if (user && currentLevel === 'aal1' && !isPublicPath && !isMFAChallengePath) {
    const mfa = await readMfaState(() => supabase.auth.mfa.listFactors())
    if (mfa.status === 'signed-out') {
      clearAuthCookies(supabaseResponse, request.cookies.getAll())
      return redirectTo('/login')
    }
    if (mfa.status === 'unavailable') {
      if (pathname.startsWith('/api/')) {
        return withSessionCookies(NextResponse.json({ error: 'Verificação de acesso indisponível.' }, { status: 503, headers: { 'Retry-After': '5' } }))
      }
      return redirectTo(challengeUrl)
    }
    if (mfa.status === 'required') return redirectTo(challengeUrl)
  }

  if (!user && !isPublicPath) {
    return redirectTo(studyDestination && studyDestination !== '/home' ? '/login?next=' + encodeURIComponent(studyDestination) : '/login')
  }

  const isOnboardingPath = pathname === '/onboarding' || pathname.startsWith('/onboarding/')

  let onboardingComplete: boolean | null = null
  async function resolveOnboardingComplete(): Promise<boolean> {
    if (onboardingComplete !== null) return onboardingComplete

    const [onboardingResponse, profileResponse] = await withTimeout<
      [OnboardingStatusResult, OnboardingProfileResult]
    >(
      Promise.all([
        Promise.resolve(
          supabase
            .from('user_onboarding')
            .select('onboarding_completed_at')
            .eq('user_id', user!.sub)
            .maybeSingle()
        ),
        Promise.resolve(
          supabase
            .from('profiles')
            .select('role,created_at')
            .eq('id', user!.sub)
            .maybeSingle()
        ),
      ]),
      3000,
      [
        { data: null, error: null },
        { data: null, error: null },
      ]
    ).catch(() => [
      { data: null, error: null },
      { data: null, error: null },
    ])

    const onboardingRow = onboardingResponse?.data
      ? {
          user_id: user!.sub,
          onboarding_completed_at: onboardingResponse.data.onboarding_completed_at,
          level_source: null,
          placement_confidence: null,
          daily_goal_minutes: null,
          interests: [],
          starter_pack_id: null,
          study_experience: null,
        }
      : null

    onboardingComplete = !shouldRequireOnboarding(onboardingRow, profileResponse?.data ?? null)
    return onboardingComplete
  }

  // Logged-in users should not land on marketing pages (e.g. PWA cold start at /)
  if (user && (pathname === '/' || pathname === '/register' || pathname === '/forgot-password')) {
    return redirectTo((await resolveOnboardingComplete()) ? '/home' : '/onboarding')
  }

  // If user is logged in and tries to access login, redirect to home
  if (user && pathname.startsWith('/login') && (!isMFAChallengePath || currentLevel === 'aal2')) {
    const next = studyReturnPath(request.nextUrl.searchParams.get('next'))
    return redirectTo((await resolveOnboardingComplete()) ? next ?? '/home' : '/onboarding')
  }

  if (
    user &&
    !isOnboardingPath &&
    !isPublicPath &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/admin')
  ) {
    const completed = await resolveOnboardingComplete()
    if (!completed) {
      return redirectTo('/onboarding')
    }
  }

  // Admin route protection — check profile role
  if (user && pathname.startsWith('/admin')) {
    const profileResponse = await withTimeout<ProfileRoleResult>(
      Promise.resolve(
        supabase
          .from('profiles')
          .select('role')
          .eq('id', user.sub)
          .single()
      ),
      3000,
      { data: { role: 'member' }, error: null }
    ).catch(() => ({ data: { role: 'member' }, error: null }))
    const profile = profileResponse?.data

    if (profile?.role !== 'admin') {
      return redirectTo('/home')
    }
  }

  return supabaseResponse
}

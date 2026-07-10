import { createServerClient } from '@supabase/ssr'
import { isAuthApiError } from '@supabase/auth-js'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/config'
import { resolveAuthenticatorAssuranceLevel } from '@/features/auth/lib/auth-assurance'
import { isPublicRequestPath } from '@/lib/supabase/publicPaths'

const AUTH_COOKIE_PREFIXES = ['supabase.auth.token', 'sb-']

type ClaimsResult = {
  data: { claims: { sub: string; aal?: unknown; amr?: unknown } & Record<string, unknown> } | null
}

type MfaFactor = {
  status?: string
}

type MfaFactorsResult = {
  data: { all: MfaFactor[] } | null
  error: unknown | null
}

type ProfileRoleResult = {
  data: { role: string | null } | null
  error: unknown | null
}

type OnboardingStatusResult = {
  data: { onboarding_completed_at: string | null } | null
  error: unknown | null
}

function clearAuthCookies(
  response: NextResponse,
  cookies: { name: string }[]
) {
  const cookieNames = cookies.map(({ name }) => name)

  for (const name of cookieNames) {
    const shouldClear = AUTH_COOKIE_PREFIXES.some((prefix) => {
      return (
        name === prefix ||
        name.startsWith(`${prefix}.`) ||
        name.startsWith(`${prefix}-`) ||
        name.startsWith(prefix)
      )
    })

    if (!shouldClear) continue

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
  const timeoutPromise = new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms)
    if (timer.unref) timer.unref()
  })
  return Promise.race([promise, timeoutPromise])
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
          supabaseResponse = NextResponse.next({
            request,
          })
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
  let invalidSession = false
  const claimsResponse = await withTimeout<ClaimsResult>(
    supabase.auth.getClaims(),
    4000,
    { data: null }
  ).catch((error: unknown) => {
    if (isInvalidRefreshTokenError(error)) {
      invalidSession = true
    }
    return { data: null }
  })

  const user = claimsResponse?.data?.claims
  const currentLevel = resolveAuthenticatorAssuranceLevel(claimsResponse?.data?.claims)

  if (invalidSession) {
    clearAuthCookies(supabaseResponse, request.cookies.getAll())
  }

  // Public routes that don't require authentication
  const isPublicPath = isPublicRequestPath(pathname)
  const isMFAChallengePath = pathname === '/login/mfa' || pathname.startsWith('/login/mfa/')

  // MFA Enforcement: If user has factors but is only aal1, redirect to challenge
  if (user && currentLevel === 'aal1' && !isPublicPath && !isMFAChallengePath) {
    const factorsResponse = await withTimeout<MfaFactorsResult>(
      supabase.auth.mfa.listFactors(),
      3000,
      { data: { all: [] }, error: null }
    ).catch(() => ({ data: { all: [] }, error: null }))
    const factors = factorsResponse?.data

    if (factors && factors.all.some((factor) => factor.status === 'verified')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login/mfa'
      return NextResponse.redirect(url)
    }
  }

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const response = NextResponse.redirect(url)

    if (invalidSession) {
      clearAuthCookies(response, request.cookies.getAll())
    }

    return response
  }

  const isOnboardingPath = pathname === '/onboarding' || pathname.startsWith('/onboarding/')

  let onboardingComplete: boolean | null = null
  async function resolveOnboardingComplete(): Promise<boolean> {
    if (onboardingComplete !== null) return onboardingComplete

    const onboardingResponse = await withTimeout<OnboardingStatusResult>(
      Promise.resolve(
        supabase
          .from('user_onboarding')
          .select('onboarding_completed_at')
          .eq('user_id', user!.sub)
          .maybeSingle()
      ),
      3000,
      { data: null, error: null }
    ).catch(() => ({ data: null, error: null }))

    onboardingComplete = Boolean(onboardingResponse?.data?.onboarding_completed_at)
    return onboardingComplete
  }

  // Logged-in users should not land on marketing pages (e.g. PWA cold start at /)
  if (user && (pathname === '/' || pathname === '/register' || pathname === '/forgot-password')) {
    const url = request.nextUrl.clone()
    url.pathname = (await resolveOnboardingComplete()) ? '/home' : '/onboarding'
    const response = NextResponse.redirect(url)

    if (invalidSession) {
      clearAuthCookies(response, request.cookies.getAll())
    }

    return response
  }

  // If user is logged in and tries to access login, redirect to home
  if (user && pathname.startsWith('/login') && (!isMFAChallengePath || currentLevel === 'aal2')) {
    const url = request.nextUrl.clone()
    url.pathname = (await resolveOnboardingComplete()) ? '/home' : '/onboarding'
    const response = NextResponse.redirect(url)

    if (invalidSession) {
      clearAuthCookies(response, request.cookies.getAll())
    }

    return response
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
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      const response = NextResponse.redirect(url)

      if (invalidSession) {
        clearAuthCookies(response, request.cookies.getAll())
      }

      return response
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
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      const response = NextResponse.redirect(url)

      if (invalidSession) {
        clearAuthCookies(response, request.cookies.getAll())
      }

      return response
    }
  }

  if (invalidSession) {
    clearAuthCookies(supabaseResponse, request.cookies.getAll())
  }

  return supabaseResponse
}

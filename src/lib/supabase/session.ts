import { createServerClient } from '@supabase/ssr'
import { isAuthApiError } from '@supabase/auth-js'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/config'
import { resolveAuthenticatorAssuranceLevel } from '@/features/auth/lib/auth-assurance'

const AUTH_COOKIE_PREFIXES = ['supabase.auth.token', 'sb-']

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
  const { data } = await supabase.auth.getClaims().catch((error: unknown) => {
    if (isInvalidRefreshTokenError(error)) {
      invalidSession = true
      return { data: null }
    }

    throw error
  })
  const user = data?.claims
  const currentLevel = resolveAuthenticatorAssuranceLevel(data?.claims)

  if (invalidSession) {
    clearAuthCookies(supabaseResponse, request.cookies.getAll())
  }

  // Public routes that don't require authentication
  const publicPaths = [
    '/_next',
    '/login',
    '/auth',
    '/api/login',
    '/images',
    '/offline',
    '/manifest.webmanifest',
    '/sw.js',
    '/pwa-',
    '/apple-icon.png',
    '/icon.svg',
    '/favicon.ico',
    '/file.svg',
    '/globe.svg',
    '/next.svg',
    '/vercel.svg',
    '/window.svg',
  ]
  const isPublicPath = publicPaths.some((path) =>
    pathname.startsWith(path)
  )
  const isMFAChallengePath = pathname === '/login/mfa' || pathname.startsWith('/login/mfa/')

  // MFA Enforcement: If user has factors but is only aal1, redirect to challenge
  if (user && currentLevel === 'aal1' && !isPublicPath && !isMFAChallengePath) {
    const { data: factors } = await supabase.auth.mfa.listFactors()
    if (factors && factors.all.some(f => f.status === 'verified')) {
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

  // If user is logged in and tries to access login, redirect to home
  if (user && pathname.startsWith('/login') && (!isMFAChallengePath || currentLevel === 'aal2')) {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    const response = NextResponse.redirect(url)

    if (invalidSession) {
      clearAuthCookies(response, request.cookies.getAll())
    }

    return response
  }

  // Admin route protection — check profile role
  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.sub)
      .single()

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

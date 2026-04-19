import { createServerClient } from '@supabase/ssr'
import { isAuthApiError } from '@supabase/auth-js'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/config'

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

  if (invalidSession) {
    clearAuthCookies(supabaseResponse, request.cookies.getAll())
  }

  // Public routes that don't require authentication
  const publicPaths = ['/login', '/auth', '/api/login']
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

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
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    const response = NextResponse.redirect(url)

    if (invalidSession) {
      clearAuthCookies(response, request.cookies.getAll())
    }

    return response
  }

  // Admin route protection — check profile role
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
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

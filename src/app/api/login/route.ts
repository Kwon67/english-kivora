import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, getRequestIp } from '@/lib/rateLimit'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/config'

type PendingCookie = {
  name: string
  value: string
  options: Parameters<NextResponse['cookies']['set']>[2]
}

const usernameMap: Record<string, string> = {
  armando: 'armando@kivora.com',
  daniel: 'daniel@kivora.com',
}

const LoginSchema = z.object({
  username: z.string().trim().min(1).max(128),
  password: z.string().min(1).max(1024),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = LoginSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Usuário e senha são obrigatórios' }, { status: 400 })
  }

  const { username, password } = parsed.data
  const rateLimit = checkRateLimit(
    `login:${getRequestIp(request)}:${username.toLowerCase()}`,
    { limit: 8, windowMs: 5 * 60 * 1000 }
  )

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' }, { status: 429 })
  }

  const pendingCookies: PendingCookie[] = []
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        pendingCookies.length = 0
        pendingCookies.push(...cookiesToSet)
      },
    },
  })

  const email =
    usernameMap[username.toLowerCase()] || (username.includes('@') ? username : `${username}@kivora.com`)

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    console.warn('Login failed', { username: username.toLowerCase(), code: error.code })
    return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 })
  }

  if (!data.user) {
    return NextResponse.json({ error: 'Erro ao obter dados do usuário' }, { status: 500 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profileError) {
    console.error('Login profile lookup failed', { userId: data.user.id, profileError })
    return NextResponse.json({ error: 'Não foi possível concluir o login' }, { status: 500 })
  }

  const response = NextResponse.json({
    success: true,
    redirectUrl: profile?.role === 'admin' ? '/admin/dashboard' : '/home',
  })

  for (const cookie of pendingCookies) {
    const safeOptions = { ...cookie.options }
    if (process.env.NODE_ENV !== 'production') {
      safeOptions.secure = false
      safeOptions.sameSite = 'lax'
    }
    response.cookies.set(cookie.name, cookie.value, safeOptions)
  }

  return response
}

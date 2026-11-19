'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/config'
import { SIGNUP_MIN_PASSWORD_LENGTH } from '@/features/auth/lib/signupValidation'

const invalid = 'Link inválido, expirado ou já utilizado. Peça outro link neste navegador.'
const verifier = 'kv-recovery-code-verifier'

async function recoveryClient() {
  const jar = await cookies()
  // Only the PKCE verifier survives between requests. Recovery access and
  // refresh tokens stay in this action and never replace a normal login.
  const memory = new Map<string, string>()
  const options = { path: '/auth', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const }
  const client = createClient(supabaseUrl, supabaseAnonKey, { auth: {
    storageKey: 'kv-recovery', flowType: 'pkce', autoRefreshToken: false, detectSessionInUrl: false,
    storage: {
      getItem: key => key === verifier ? jar.get(key)?.value ?? null : memory.get(key) ?? null,
      setItem(key, value) {
        if (key === verifier) jar.set(key, value, { ...options, maxAge: 3600 })
        else memory.set(key, value)
      },
      removeItem(key) {
        if (key === verifier) jar.set(key, '', { ...options, maxAge: 0 })
        else memory.delete(key)
      },
    },
  } })
  return { client, jar }
}

export async function requestRecovery(email: string) {
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false
  const site = process.env.NEXT_PUBLIC_SITE_URL
  if (!site) return false
  const redirectTo = new URL('/auth/recovery', site).href
  const { client } = await recoveryClient()
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo })
  return !error
}

export async function finishRecovery(_: string, form: FormData) {
  const password = form.get('password')
  if (typeof password !== 'string' || password.length < SIGNUP_MIN_PASSWORD_LENGTH || Buffer.byteLength(password) > 72)
    return 'Use pelo menos 12 caracteres e até 72 bytes.'
  if (form.get('confirmation') !== password) return 'As senhas não conferem.'
  const { client, jar } = await recoveryClient()
  const code = jar.get('kv-recovery-ticket')?.value
  if (!code || (!code.startsWith('hash:') && !jar.get(verifier)?.value)) return invalid
  jar.set('kv-recovery-ticket', '', { path: '/auth/new-password', maxAge: 0 })
  try {
    if (code.startsWith('hash:')) {
      const verified = await client.auth.verifyOtp({ type: 'recovery', token_hash: code.slice(5) })
      if (verified.error || !verified.data?.session) return invalid
    } else {
      const exchanged = await client.auth.exchangeCodeForSession(code)
      if (exchanged.error || !exchanged.data?.session || !('redirectType' in exchanged.data) || exchanged.data.redirectType !== 'recovery') return invalid
    }
    try {
      const updated = await client.auth.updateUser({ password })
      if (updated.error) return 'Não foi possível atualizar a senha. Solicite outro link para tentar novamente.'
      return 'ok'
    } finally {
      // Recovery sessions are in memory. A failed cleanup must not invalidate a confirmed password change.
      try { await client.auth.signOut({ scope: 'local' }) }
      catch { /* The request-scoped session is discarded when this action ends. */ }
    }
  } catch {
    return 'Não foi possível confirmar a alteração. Tente entrar com a nova senha ou solicite outro link.'
  }
}

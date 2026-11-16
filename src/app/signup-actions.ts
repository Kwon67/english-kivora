'use server'

import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getClientIp, hashSecurityValue, isRateLimited, recordSecurityEvent } from '@/features/security/lib/security'
import { SIGNUP_MIN_PASSWORD_LENGTH, SIGNUP_USERNAME_PATTERN } from '@/features/auth/lib/signupValidation'

const SIGNUP_SCHEMA = z.object({
  username: z.string().trim().toLowerCase().refine(
    username => !username || SIGNUP_USERNAME_PATTERN.test(username),
    { error: 'Use de 3 a 24 caracteres no nome de usuário. São aceitas letras, números e underscore.' },
  ).optional(),
  email: z.string().trim().toLowerCase().pipe(z.email({ error: 'Informe um e-mail válido.' }).max(254)),
  password: z.string()
    .min(SIGNUP_MIN_PASSWORD_LENGTH, { error: `Use pelo menos ${SIGNUP_MIN_PASSWORD_LENGTH} caracteres na senha.` })
    .refine(password => new TextEncoder().encode(password).length <= 72, { error: 'A senha ultrapassa o tamanho máximo permitido.' }),
  confirmPassword: z.string().max(72),
  website: z.string().max(512).optional(),
}).refine(input => input.password === input.confirmPassword, { error: 'As senhas não conferem.' })

type SignupResult = { ok: true } | { ok: false; error: string }

function getSignupRedirectUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.NODE_ENV === 'production' ? 'https://english-kivora.vercel.app' : 'http://localhost:3000')
  return new URL('/auth/confirm', siteUrl).href
}

export async function requestSignupVerification(input: unknown): Promise<SignupResult> {
  const parsed = SIGNUP_SCHEMA.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const { username, email, password, website } = parsed.data
  if (website?.trim()) return { ok: true }

  const ip = await getClientIp()
  const [ipLimited, emailLimited] = await Promise.all([
    isRateLimited('signup_request_ip', ip, 8, 15 * 60),
    isRateLimited('signup_request_email', hashSecurityValue(email), 4, 15 * 60),
  ])
  if (ipLimited || emailLimited) {
    return { ok: false, error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: username || `membro_${randomBytes(8).toString('hex')}` },
      emailRedirectTo: getSignupRedirectUrl(),
    },
  })

  // Supabase may return an obfuscated user or an explicit duplicate error,
  // depending on the Auth settings. Keep the public response identical.
  if (!error || error.code === 'user_already_exists' || error.code === 'email_exists') return { ok: true }

  await recordSecurityEvent({
    eventType: 'signup_request_failed',
    severity: 'medium',
    identifier: email,
    ipAddress: ip,
    route: '/register',
    metadata: { code: error.code ?? null },
  })

  if (error.code === 'weak_password') return { ok: false, error: 'Escolha uma senha mais forte.' }
  if (error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit') {
    return { ok: false, error: 'Aguarde alguns minutos antes de solicitar outro e-mail.' }
  }
  if (error.code === 'unexpected_failure' || (error.status && error.status >= 500)) {
    return { ok: false, error: 'O cadastro está temporariamente indisponível. Tente novamente mais tarde.' }
  }
  return { ok: false, error: 'Não foi possível criar sua conta. Confira os dados ou tente outro nome de usuário.' }
}

'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { sendSignupVerificationEmail } from '@/features/auth/lib/sendSignupVerificationEmail'
import { formatResendErrorForUser } from '@/lib/resendMail'
import {
  decryptSignupPassword,
  encryptSignupPassword,
  generateSignupCode,
  getSignupExpiryDate,
  hashSignupCode,
  hashSignupEmail,
  maskEmail,
  normalizeSignupEmail,
  normalizeSignupUsername,
  SIGNUP_CODE_LENGTH,
  SIGNUP_MAX_ATTEMPTS,
} from '@/features/auth/lib/signupVerification'
import {
  getClientIp,
  hashSecurityValue,
  isRateLimited,
  recordSecurityEvent,
} from '@/features/security/lib/security'

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/

type SignupFailure = { ok: false; error: string }
type SignupRequestSuccess = { ok: true; maskedEmail: string; email: string }
type SignupVerifySuccess = { ok: true }

export type SignupRequestResult = SignupRequestSuccess | SignupFailure
export type SignupVerifyResult = SignupVerifySuccess | SignupFailure
export type SignupResendResult = SignupRequestSuccess | SignupFailure

type SignupVerificationRow = {
  id: string
  email: string
  username: string
  password_ciphertext: string
  code_hash: string
  attempt_count: number
  expires_at: string
}

function getAuthErrorMessage(message?: string) {
  const normalized = message?.toLowerCase() || ''

  if (normalized.includes('already') || normalized.includes('registered') || normalized.includes('exists')) {
    return 'Este email já está cadastrado. Entre com sua conta existente.'
  }

  if (normalized.includes('password')) {
    return 'A senha não atende aos requisitos de segurança.'
  }

  if (normalized.includes('database') || normalized.includes('username')) {
    return 'Não foi possível criar o perfil. Tente outro nome de usuário.'
  }

  return message || 'Não foi possível concluir o cadastro agora. Tente novamente.'
}

function isValidPassword(password: string) {
  return password.length >= 6 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
}

async function assertSignupRateLimit(scope: string, identifier: string, limit: number, windowSeconds: number) {
  const limited = await isRateLimited(scope, identifier, limit, windowSeconds)
  if (limited) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  }

  return null
}

async function emailAlreadyRegistered(email: string) {
  const admin = createAdminClient()
  if (!admin) return false

  const { data: profileMatch } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  return Boolean(profileMatch)
}

async function usernameAlreadyRegistered(username: string) {
  const admin = createAdminClient()
  if (!admin) return false

  const { data: profileMatch } = await admin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  return Boolean(profileMatch)
}

async function upsertSignupVerification(input: {
  email: string
  username: string
  password: string
  code: string
}) {
  const admin = createAdminClient()
  if (!admin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente')
  }

  const emailHash = hashSignupEmail(input.email)
  const payload = {
    email: input.email,
    email_hash: emailHash,
    username: input.username,
    password_ciphertext: encryptSignupPassword(input.password),
    code_hash: hashSignupCode(input.email, input.code),
    attempt_count: 0,
    expires_at: getSignupExpiryDate().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { error } = await admin
    .from('signup_verifications')
    .upsert(payload, { onConflict: 'email_hash' })

  if (error) {
    throw new Error(error.message)
  }
}

async function getSignupVerification(email: string) {
  const admin = createAdminClient()
  if (!admin) return null

  const { data, error } = await admin
    .from('signup_verifications')
    .select('id,email,username,password_ciphertext,code_hash,attempt_count,expires_at')
    .eq('email_hash', hashSignupEmail(email))
    .maybeSingle()

  if (error || !data) return null
  return data as SignupVerificationRow
}

async function deleteSignupVerification(email: string) {
  const admin = createAdminClient()
  if (!admin) return

  await admin
    .from('signup_verifications')
    .delete()
    .eq('email_hash', hashSignupEmail(email))
}

export async function requestSignupVerification(input: {
  username: string
  email: string
  password: string
  confirmPassword: string
  website?: string
}): Promise<SignupRequestResult> {
  const ip = await getClientIp()

  if (input.website?.trim()) {
    return { ok: true, maskedEmail: maskEmail(input.email || 'conta@kivora.dev'), email: normalizeSignupEmail(input.email || 'conta@kivora.dev') }
  }

  const username = normalizeSignupUsername(input.username)
  const email = normalizeSignupEmail(input.email)
  const password = input.password
  const confirmPassword = input.confirmPassword

  const rateLimited = await assertSignupRateLimit('signup_request_ip', ip, 8, 15 * 60)
  if (rateLimited) return { ok: false, error: rateLimited }

  const emailRateLimited = await assertSignupRateLimit('signup_request_email', hashSecurityValue(email), 4, 15 * 60)
  if (emailRateLimited) return { ok: false, error: emailRateLimited }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false,
      error: 'Use um nome de usuário com 3 a 24 caracteres: letras minúsculas, números ou underline.',
    }
  }

  if (!email.includes('@') || email.length < 6) {
    return { ok: false, error: 'Informe um email válido para acessar sua conta depois.' }
  }

  if (!isValidPassword(password)) {
    return { ok: false, error: 'A senha deve ter pelo menos 6 caracteres, com letras e números.' }
  }

  if (password !== confirmPassword) {
    return { ok: false, error: 'As senhas não conferem.' }
  }

  if (await usernameAlreadyRegistered(username)) {
    return { ok: false, error: 'Este nome de usuário já está em uso.' }
  }

  if (await emailAlreadyRegistered(email)) {
    return { ok: false, error: 'Este email já está cadastrado. Entre com sua conta existente.' }
  }

  const code = generateSignupCode()

  try {
    await upsertSignupVerification({ email, username, password, code })
    await sendSignupVerificationEmail({ email, username, code })
  } catch (error) {
    await recordSecurityEvent({
      eventType: 'signup_email_failed',
      severity: 'medium',
      identifier: email,
      ipAddress: ip,
      route: '/register',
      metadata: {
        message: error instanceof Error ? error.message : 'unknown',
      },
    })

    return { ok: false, error: formatResendErrorForUser(error) }
  }

  await recordSecurityEvent({
    eventType: 'signup_code_sent',
    severity: 'low',
    identifier: email,
    ipAddress: ip,
    route: '/register',
  })

  return { ok: true, maskedEmail: maskEmail(email), email }
}

export async function resendSignupVerificationCode(emailInput: string): Promise<SignupResendResult> {
  const ip = await getClientIp()
  const email = normalizeSignupEmail(emailInput)

  const rateLimited = await assertSignupRateLimit('signup_resend_ip', ip, 5, 15 * 60)
  if (rateLimited) return { ok: false, error: rateLimited }

  const emailRateLimited = await assertSignupRateLimit('signup_resend_email', hashSecurityValue(email), 3, 15 * 60)
  if (emailRateLimited) return { ok: false, error: emailRateLimited }

  const existing = await getSignupVerification(email)
  if (!existing) {
    return { ok: false, error: 'Não encontramos um cadastro pendente para este email. Comece novamente.' }
  }

  if (new Date(existing.expires_at).getTime() <= Date.now()) {
    await deleteSignupVerification(email)
    return { ok: false, error: 'O código anterior expirou. Preencha o formulário novamente.' }
  }

  const password = decryptSignupPassword(existing.password_ciphertext)
  const code = generateSignupCode()

  try {
    await upsertSignupVerification({
      email,
      username: existing.username,
      password,
      code,
    })
    await sendSignupVerificationEmail({
      email,
      username: existing.username,
      code,
    })
  } catch (error) {
    return { ok: false, error: formatResendErrorForUser(error) }
  }

  return { ok: true, maskedEmail: maskEmail(email), email }
}

export async function verifySignupCodeAction(input: {
  email: string
  code: string
}): Promise<SignupVerifyResult> {
  const ip = await getClientIp()
  const email = normalizeSignupEmail(input.email)
  const code = input.code.replace(/\D/g, '').slice(0, SIGNUP_CODE_LENGTH)

  const rateLimited = await assertSignupRateLimit('signup_verify_ip', ip, 12, 15 * 60)
  if (rateLimited) return { ok: false, error: rateLimited }

  if (code.length !== SIGNUP_CODE_LENGTH) {
    return { ok: false, error: 'Informe o código de 6 dígitos enviado para seu email.' }
  }

  const pending = await getSignupVerification(email)
  if (!pending) {
    return { ok: false, error: 'Não encontramos um cadastro pendente para este email. Comece novamente.' }
  }

  if (new Date(pending.expires_at).getTime() <= Date.now()) {
    await deleteSignupVerification(email)
    return { ok: false, error: 'Este código expirou. Solicite um novo código para continuar.' }
  }

  if (pending.attempt_count >= SIGNUP_MAX_ATTEMPTS) {
    await deleteSignupVerification(email)
    return { ok: false, error: 'Número máximo de tentativas atingido. Comece o cadastro novamente.' }
  }

  const codeMatches = pending.code_hash === hashSignupCode(email, code)
  if (!codeMatches) {
    const admin = createAdminClient()
    if (admin) {
      await admin
        .from('signup_verifications')
        .update({
          attempt_count: pending.attempt_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pending.id)
    }

    await recordSecurityEvent({
      eventType: 'signup_code_invalid',
      severity: 'medium',
      identifier: email,
      ipAddress: ip,
      route: '/register',
      metadata: { attempts: pending.attempt_count + 1 },
    })

    return { ok: false, error: 'Código inválido. Confira os 6 dígitos enviados por email.' }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { ok: false, error: 'Serviço de cadastro indisponível no momento.' }
  }

  const password = decryptSignupPassword(pending.password_ciphertext)

  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username: pending.username,
      role: 'member',
    },
  })

  if (createError || !createdUser.user) {
    await recordSecurityEvent({
      eventType: 'signup_create_user_failed',
      severity: 'high',
      identifier: email,
      ipAddress: ip,
      route: '/register',
      metadata: { message: createError?.message || 'unknown' },
    })

    return { ok: false, error: getAuthErrorMessage(createError?.message) }
  }

  await deleteSignupVerification(email)

  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

  if (signInError) {
    await recordSecurityEvent({
      eventType: 'signup_signin_after_verify_failed',
      severity: 'medium',
      identifier: email,
      ipAddress: ip,
      route: '/register',
      metadata: { message: signInError.message },
    })

    return { ok: false, error: 'Conta criada, mas não foi possível iniciar sua sessão automaticamente. Entre com seu email e senha.' }
  }

  await recordSecurityEvent({
    eventType: 'signup_verified',
    severity: 'low',
    actorUserId: createdUser.user.id,
    identifier: email,
    ipAddress: ip,
    route: '/register',
  })

  revalidatePath('/', 'layout')
  return { ok: true }
}
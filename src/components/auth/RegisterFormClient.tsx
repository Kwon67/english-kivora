'use client'

import { type CSSProperties, type FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { notify } from '@/lib/toast'

type RegisterStatus =
  | { type: 'error'; message: string }
  | { type: 'success'; message: string }
  | null

const usernamePattern = /^[a-z0-9_]{3,24}$/
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? 'https://english-kivora.vercel.app'

function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function getAuthErrorMessage(message?: string) {
  const normalized = message?.toLowerCase() || ''

  if (normalized.includes('already') || normalized.includes('registered')) {
    return 'Este email já está cadastrado. Entre com sua conta existente.'
  }

  if (normalized.includes('password')) {
    return 'A senha não atende aos requisitos de segurança.'
  }

  if (normalized.includes('database')) {
    return 'Não foi possível criar o perfil. Tente outro nome de usuário.'
  }

  return message || 'Não foi possível criar sua conta agora. Tente novamente.'
}

function inputShellClass(hasTrailingIcon = false) {
  return [
    'Input self-stretch py-3 bg-[#f4f5e8]/50 rounded-xl border border-dashed border-[#172113]/24 inline-flex justify-center items-start overflow-hidden w-full transition-all focus-within:border-solid focus-within:border-[#183b16] focus-within:shadow-[0_0_14px_rgba(24,59,22,0.12)] focus-within:bg-[#fbfcf2]/90 dark:bg-[#1a2513]/30 dark:border-[#d5e6a9]/24 dark:focus-within:border-solid dark:focus-within:border-[#b8ff5c] dark:focus-within:bg-[#11160e]/90 dark:focus-within:shadow-[0_0_14px_rgba(184,255,92,0.12)]',
    hasTrailingIcon ? 'pl-4 pr-10' : 'pl-4 pr-4',
  ].join(' ')
}

export default function RegisterFormClient() {
  const [status, setStatus] = useState<RegisterStatus>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const supabase = useMemo(() => createClient(), [])

  const passwordRules = useMemo(() => {
    return [
      { label: 'Mínimo de 6 caracteres', valid: password.length >= 6 },
      { label: 'Pelo menos 1 letra', valid: /[a-zA-Z]/.test(password) },
      { label: 'Pelo menos 1 número', valid: /[0-9]/.test(password) },
    ]
  }, [password])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const website = String(formData.get('website') || '')
    const username = normalizeUsername(String(formData.get('username') || ''))
    const email = normalizeEmail(String(formData.get('email') || ''))
    const pwd = String(formData.get('password') || '')
    const confirmPwd = String(formData.get('confirmPassword') || '')

    if (website) {
      setLoading(false)
      setStatus({ type: 'success', message: 'Cadastro recebido. Verifique seu email para continuar.' })
      return
    }

    if (!usernamePattern.test(username)) {
      setLoading(false)
      notify.error('Verifique os campos')
      setStatus({
        type: 'error',
        message: 'Use um nome de usuário com 3 a 24 caracteres: letras minúsculas, números ou underline.',
      })
      return
    }

    if (!email.includes('@') || email.length < 6) {
      setLoading(false)
      notify.error('Verifique os campos')
      setStatus({ type: 'error', message: 'Informe um email válido para acessar sua conta depois.' })
      return
    }

    if (pwd.length < 6) {
      setLoading(false)
      notify.error('Verifique os campos')
      setStatus({ type: 'error', message: 'A senha deve ter pelo menos 6 caracteres.' })
      return
    }

    if (pwd !== confirmPwd) {
      setLoading(false)
      notify.error('Verifique os campos')
      setStatus({ type: 'error', message: 'As senhas não conferem.' })
      return
    }

    const usernameLookup = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (usernameLookup.data) {
      setLoading(false)
      notify.error('Verifique os campos')
      setStatus({ type: 'error', message: 'Este nome de usuário já está em uso.' })
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pwd,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        data: {
          username,
          role: 'member',
        },
      },
    })

    if (error) {
      setLoading(false)
      notify.error('Verifique os campos')
      setStatus({ type: 'error', message: getAuthErrorMessage(error.message) })
      return
    }

    if (data.session) {
      notify.success('Bem-vindo ao Kivora English!')
      window.location.replace('/home')
      return
    }

    setLoading(false)
    setStatus({
      type: 'success',
      message: 'Conta criada. Verifique seu email para confirmar o acesso ao Kivora English.',
    })
    notify.success('Bem-vindo ao Kivora English!')
  }

  return (
    <form onSubmit={handleSubmit} className="LoginForm flex w-full max-w-96 flex-col items-start justify-start gap-4">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="flex w-full flex-col items-start gap-1.5">
        <label htmlFor="register-username" className="cursor-pointer font-inter text-xs font-semibold leading-5 text-[#425039] dark:text-[#b9c3a4]">
          Nome de usuário
        </label>
        <div className="relative flex w-full flex-col items-start">
          <div className={inputShellClass()}>
            <input
              id="register-username"
              name="username"
              type="text"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Enter"
              data-testid="register-username"
              className="w-full border-none bg-transparent p-0 font-inter text-base font-normal outline-none focus:outline-none focus:ring-0"
              style={{ color: 'var(--color-text)', '--tw-placeholder-color': 'var(--color-text-subtle)' } as CSSProperties}
            />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-1.5">
        <label htmlFor="register-email" className="cursor-pointer font-inter text-xs font-semibold leading-5 text-[#425039] dark:text-[#b9c3a4]">
          Email
        </label>
        <div className="relative flex w-full flex-col items-start">
          <div className={inputShellClass()}>
            <input
              id="register-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Enter"
              data-testid="register-email"
              className="w-full border-none bg-transparent p-0 font-inter text-base font-normal outline-none focus:outline-none focus:ring-0"
              style={{ color: 'var(--color-text)', '--tw-placeholder-color': 'var(--color-text-subtle)' } as CSSProperties}
            />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-1.5">
        <label htmlFor="register-password" className="cursor-pointer font-inter text-xs font-semibold leading-5 text-[#425039] dark:text-[#b9c3a4]">
          Senha
        </label>
        <div className="relative flex w-full flex-col items-start">
          <div className={inputShellClass(true)}>
            <input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Enter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="register-password"
              className="w-full border-none bg-transparent p-0 font-inter text-base font-normal outline-none focus:outline-none focus:ring-0"
              style={{ color: 'var(--color-text)', '--tw-placeholder-color': 'var(--color-text-subtle)' } as CSSProperties}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-0 top-0 inline-flex h-12 items-center justify-start pr-3 text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] focus:outline-none"
            aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" strokeWidth={2} /> : <Eye className="h-5 w-5" strokeWidth={2} />}
          </button>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-1.5">
        <label htmlFor="register-confirm-password" className="cursor-pointer font-inter text-xs font-semibold leading-5 text-[#425039] dark:text-[#b9c3a4]">
          Confirmar senha
        </label>
        <div className="relative flex w-full flex-col items-start">
          <div className={inputShellClass(true)}>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Enter"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              data-testid="register-confirm-password"
              className="w-full border-none bg-transparent p-0 font-inter text-base font-normal outline-none focus:outline-none focus:ring-0"
              style={{ color: 'var(--color-text)', '--tw-placeholder-color': 'var(--color-text-subtle)' } as CSSProperties}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowConfirmPassword((current) => !current)}
            className="absolute right-0 top-0 inline-flex h-12 items-center justify-start pr-3 text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] focus:outline-none"
            aria-label={showConfirmPassword ? 'Esconder confirmação de senha' : 'Mostrar confirmação de senha'}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" strokeWidth={2} /> : <Eye className="h-5 w-5" strokeWidth={2} />}
          </button>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2.5 mt-1">
        <span className="text-xs font-semibold text-[#425039] dark:text-[#b9c3a4]">
          Sua senha deve ter:
        </span>
        <div className="flex flex-col gap-2">
          {passwordRules.map((rule, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs transition-colors duration-200">
              <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${
                rule.valid 
                  ? 'text-[#183b16] dark:text-[#b8ff5c]' 
                  : 'text-[#425039]/40 dark:text-[#b9c3a4]/40'
              }`}>
                {rule.valid ? (
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-current opacity-60" />
                )}
              </span>
              <span className={rule.valid ? 'text-[#10130f] dark:text-[#f4f7e9]' : 'text-[#425039]/60 dark:text-[#b9c3a4]/60'}>
                {rule.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {status && (
        <div
          className={`flex w-full items-start gap-3 rounded-[0.75rem] border px-4 py-3 text-sm font-medium ${
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300'
              : 'border-red-200 bg-red-50 text-[var(--color-error)] dark:border-red-400/20 dark:bg-red-400/10'
          }`}
          data-testid={`register-${status.type}`}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.3} />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.3} />
          )}
          <span>{status.message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        data-testid="register-submit"
        className="inline-flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-[#183b16] py-3.5 font-montserrat text-lg font-bold leading-7 text-[#f7f8ef] border border-dashed border-[#e3ecc2]/50 shadow-[0px_8px_15px_0px_rgba(24,59,22,0.15)] transition-colors hover:bg-[#24551d] dark:bg-[#b8ff5c] dark:text-[#050704] dark:border-[#1d2b14]/50 dark:hover:bg-[#cbff83] focus:outline-none focus:ring-2 focus:ring-[#183b16]/40 dark:focus:ring-[#b8ff5c]/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Criando...' : 'Criar conta'}
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-current" /> : <CheckCircle2 className="h-5 w-5 text-current" strokeWidth={2.3} />}
      </button>

      <p className="text-center w-full text-xs leading-5 text-[var(--color-text-muted)]">
        Ao continuar, você concorda com os{' '}
        <Link href="/terms" className="font-semibold text-[var(--color-primary)] hover:underline">
          Termos de uso
        </Link>{' '}
        e a{' '}
        <Link href="/privacy" className="font-semibold text-[var(--color-primary)] hover:underline">
          Privacidade
        </Link>
        .
      </p>
    </form>
  )
}

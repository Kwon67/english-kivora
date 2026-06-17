'use client'

import { type CSSProperties, type FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Mail } from 'lucide-react'
import {
  requestSignupVerification,
  resendSignupVerificationCode,
  verifySignupCodeAction,
} from '@/app/signup-actions'
import { notify } from '@/lib/toast'
import { authInput, authSubmitBtn } from '@/lib/brandUi'

type RegisterStatus =
  | { type: 'error'; message: string }
  | { type: 'success'; message: string }
  | null

type RegisterStep = 'form' | 'verify'

function inputShellClass(hasTrailingIcon = false) {
  return [
    authInput,
    hasTrailingIcon ? 'pl-4 pr-10' : 'px-4',
  ].join(' ')
}

export default function RegisterFormClient() {
  const [step, setStep] = useState<RegisterStep>('form')
  const [status, setStatus] = useState<RegisterStatus>(null)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')

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
    const username = String(formData.get('username') || '')
    const email = String(formData.get('email') || '')
    const pwd = String(formData.get('password') || '')
    const confirmPwd = String(formData.get('confirmPassword') || '')

    const result = await requestSignupVerification({
      username,
      email,
      password: pwd,
      confirmPassword: confirmPwd,
      website,
    })

    setLoading(false)

    if (!result.ok) {
      notify.error('Verifique os campos')
      setStatus({ type: 'error', message: result.error })
      return
    }

    setPendingEmail(result.email)
    setMaskedEmail(result.maskedEmail)
    setVerificationCode('')
    setStep('verify')
    setStatus({
      type: 'success',
      message: `Enviamos um código de 6 dígitos para ${result.maskedEmail}. Insira-o abaixo para confirmar sua conta.`,
    })
    notify.success('Código enviado para seu email')
  }

  async function handleVerifySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    setLoading(true)

    const result = await verifySignupCodeAction({
      email: pendingEmail,
      code: verificationCode,
    })

    if (!result.ok) {
      setLoading(false)
      notify.error('Código inválido')
      setStatus({ type: 'error', message: result.error })
      return
    }

    notify.success('Conta confirmada com sucesso!')
    window.location.replace('/home')
  }

  async function handleResendCode() {
    if (!pendingEmail || resendLoading) return

    setResendLoading(true)
    setStatus(null)

    const result = await resendSignupVerificationCode(pendingEmail)
    setResendLoading(false)

    if (!result.ok) {
      notify.error('Não foi possível reenviar')
      setStatus({ type: 'error', message: result.error })
      return
    }

    setMaskedEmail(result.maskedEmail)
    setStatus({
      type: 'success',
      message: `Enviamos um novo código para ${result.maskedEmail}.`,
    })
    notify.success('Novo código enviado')
  }

  function handleBackToForm() {
    setStep('form')
    setStatus(null)
    setVerificationCode('')
  }

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerifySubmit} className="LoginForm flex w-full max-w-96 flex-col items-start justify-start gap-4">
        <div className="flex w-full items-start gap-3 rounded-[0.9rem] border border-primary/15 bg-primary-light px-4 py-3 text-sm text-primary dark:border-primary/20 dark:bg-primary/10">
          <Mail className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} />
          <div>
            <p className="font-semibold">Verifique seu email</p>
            <p className="mt-1 text-xs leading-5 text-text-muted dark:text-text-muted">
              Digite o código de 6 dígitos enviado para <span className="font-semibold text-text dark:text-text">{maskedEmail}</span>.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-1.5">
          <label
            htmlFor="register-verification-code"
            className="cursor-pointer font-inter text-xs font-semibold leading-5 text-text-muted dark:text-text-muted"
          >
            Código de verificação
          </label>
          <div className={inputShellClass()}>
            <input
              id="register-verification-code"
              name="verificationCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              placeholder="000000"
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              data-testid="register-verification-code"
              className="w-full appearance-none border-none bg-transparent p-0 text-center font-mono text-2xl font-semibold tracking-[0.42em] text-text outline-none focus:outline-none focus:ring-0"
              style={{ color: 'var(--color-text)', '--tw-placeholder-color': 'var(--color-text-subtle)' } as CSSProperties}
              required
              autoFocus
            />
          </div>
        </div>

        {status && (
          <div
            className={`flex w-full items-start gap-3 rounded-[0.75rem] border px-4 py-3 text-sm font-medium ${ status.type === 'success' ? 'border-primary/20 bg-primary-light text-primary dark:bg-primary/10' : 'border-red-200 bg-red-50 text-[var(--color-error)] dark:border-red-400/20 dark:bg-red-400/10' }`}
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
          disabled={loading || verificationCode.length !== 6}
          data-testid="register-verify-submit"
          className={authSubmitBtn}
        >
          {loading ? 'Confirmando...' : 'Confirmar conta'}
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-current" /> : <CheckCircle2 className="h-5 w-5 text-current" strokeWidth={2.3} />}
        </button>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleBackToForm}
            className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendLoading}
            className="text-sm font-semibold text-primary hover:underline disabled:opacity-60"
          >
            {resendLoading ? 'Reenviando...' : 'Reenviar código'}
          </button>
        </div>
      </form>
    )
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
        <label htmlFor="register-username" className="cursor-pointer font-inter text-xs font-semibold leading-5 text-text-muted dark:text-text-muted">
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
        <label htmlFor="register-email" className="cursor-pointer font-inter text-xs font-semibold leading-5 text-text-muted dark:text-text-muted">
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
        <label htmlFor="register-password" className="cursor-pointer font-inter text-xs font-semibold leading-5 text-text-muted dark:text-text-muted">
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
            className="absolute right-0 top-0 inline-flex h-12 items-center justify-start pr-3 text-text-subtle hover:text-primary focus:outline-none"
            aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" strokeWidth={2} /> : <Eye className="h-5 w-5" strokeWidth={2} />}
          </button>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-1.5">
        <label htmlFor="register-confirm-password" className="cursor-pointer font-inter text-xs font-semibold leading-5 text-text-muted dark:text-text-muted">
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
            className="absolute right-0 top-0 inline-flex h-12 items-center justify-start pr-3 text-text-subtle hover:text-primary focus:outline-none"
            aria-label={showConfirmPassword ? 'Esconder confirmação de senha' : 'Mostrar confirmação de senha'}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" strokeWidth={2} /> : <Eye className="h-5 w-5" strokeWidth={2} />}
          </button>
        </div>
      </div>

      <div className="mt-1 flex w-full flex-col gap-2.5">
        <span className="text-xs font-semibold text-text-muted dark:text-text-muted">
          Sua senha deve ter:
        </span>
        <div className="flex flex-col gap-2">
          {passwordRules.map((rule, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs transition-colors duration-200">
              <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${ rule.valid ? 'text-primary' : 'text-text-muted/40 dark:text-text-muted/40' }`}>
                {rule.valid ? (
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-current opacity-60" />
                )}
              </span>
              <span className={rule.valid ? 'text-text dark:text-text' : 'text-text-muted/60 dark:text-text-muted/60'}>
                {rule.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {status && (
        <div
          className={`flex w-full items-start gap-3 rounded-[0.75rem] border px-4 py-3 text-sm font-medium ${ status.type === 'success' ? 'border-primary/20 bg-primary-light text-primary dark:bg-primary/10' : 'border-red-200 bg-red-50 text-[var(--color-error)] dark:border-red-400/20 dark:bg-red-400/10' }`}
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
        className={authSubmitBtn}
      >
        {loading ? 'Enviando código...' : 'Criar conta'}
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-current" /> : <CheckCircle2 className="h-5 w-5 text-current" strokeWidth={2.3} />}
      </button>

      <p className="w-full text-center text-xs leading-5 text-text-muted">
        Ao continuar, você concorda com os{' '}
        <Link href="/terms" className="font-semibold text-primary hover:underline">
          Termos de uso
        </Link>{' '}
        e a{' '}
        <Link href="/privacy" className="font-semibold text-primary hover:underline">
          Privacidade
        </Link>
        .
      </p>
    </form>
  )
}
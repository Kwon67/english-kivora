'use client'

import { type FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Mail } from 'lucide-react'
import {
  requestSignupVerification,
  resendSignupVerificationCode,
  verifySignupCodeAction,
} from '@/app/signup-actions'
import { notify } from '@/lib/toast'
import { ANALYTICS_EVENT, trackEvent } from '@/lib/analytics'
import { landingInputClass , landingRadiusLg} from '@/lib/landingStyles'

type RegisterStatus =
  | { type: 'error'; message: string }
  | { type: 'success'; message: string }
  | null

type RegisterStep = 'form' | 'verify'

function inputShellClass(hasTrailingIcon = false) {
  return [
    `Input self-stretch py-3 inline-flex justify-center items-start overflow-hidden w-full ${landingInputClass}`,
    hasTrailingIcon ? 'pl-4 pr-10' : 'px-4',
  ].join(' ')
}

const submitButtonClass =
  'inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-container border border-brand-dark bg-brand-accent px-6 py-3 font-heading text-lg font-bold text-brand-dark transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 disabled:cursor-not-allowed disabled:opacity-50'

const labelClass = 'cursor-pointer text-xs font-semibold leading-5 text-brand-secondary'
const inputClass =
  'w-full border-none bg-transparent p-0 font-body text-base font-normal text-brand-dark outline-none placeholder:text-brand-secondary/70 focus:outline-none focus:ring-0'
const statusBaseClass = 'flex w-full items-start gap-3 rounded-container border px-4 py-3 text-sm font-medium'

export default function RegisterFormClient({ intentPro = false }: { intentPro?: boolean }) {
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

    trackEvent(ANALYTICS_EVENT.SIGNUP, { intentPro })
    notify.success('Conta confirmada com sucesso!')
    window.location.replace(intentPro ? '/onboarding?plan=pro' : '/onboarding')
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
      <form onSubmit={handleVerifySubmit} className="LoginForm flex w-full flex-col items-start justify-start gap-4">
        <div className={`flex w-full items-start gap-3 ${landingRadiusLg} border border-brand-dark bg-brand-accent px-4 py-3 text-sm text-brand-dark`}>
          <Mail className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} />
          <div>
            <p className="font-semibold">Verifique seu email</p>
            <p className="mt-1 text-xs leading-5 text-brand-dark/75">
              Digite o código de 6 dígitos enviado para <span className="font-semibold text-brand-dark">{maskedEmail}</span>.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-1.5">
          <label
            htmlFor="register-verification-code"
            className={labelClass}
          >
            Código de verificação
          </label>
          <div className={`Input w-full ${landingInputClass}`}>
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
              className="w-full appearance-none border-0 bg-transparent px-4 py-4 text-center font-heading text-2xl font-bold tracking-[0.42em] text-brand-dark shadow-none outline-none placeholder:text-brand-secondary/60 focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
              required
              autoFocus
            />
          </div>
        </div>

        {status && (
          <div
            className={`${statusBaseClass} ${status.type === 'success' ? 'border-brand-dark bg-brand-accent text-brand-dark' : 'border-red-300 bg-red-50 text-[var(--color-error)]'}`}
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
          className={submitButtonClass}
        >
          {loading ? 'Confirmando...' : 'Confirmar conta'}
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-current" /> : <CheckCircle2 className="h-5 w-5 text-current" strokeWidth={2.3} />}
        </button>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleBackToForm}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-secondary transition-colors hover:text-brand-dark"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendLoading}
            className="text-sm font-semibold text-brand-dark underline underline-offset-4 disabled:opacity-60"
          >
            {resendLoading ? 'Reenviando...' : 'Reenviar código'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="LoginForm flex w-full flex-col items-start justify-start gap-4">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="flex w-full flex-col items-start gap-1.5">
        <label htmlFor="register-username" className={labelClass}>
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
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-1.5">
        <label htmlFor="register-email" className={labelClass}>
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
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-1.5">
        <label htmlFor="register-password" className={labelClass}>
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
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-0 top-0 inline-flex h-12 items-center justify-start pr-3 text-brand-secondary hover:text-brand-dark focus:outline-none"
            aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" strokeWidth={2} /> : <Eye className="h-5 w-5" strokeWidth={2} />}
          </button>
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-1.5">
        <label htmlFor="register-confirm-password" className={labelClass}>
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
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowConfirmPassword((current) => !current)}
            className="absolute right-0 top-0 inline-flex h-12 items-center justify-start pr-3 text-brand-secondary hover:text-brand-dark focus:outline-none"
            aria-label={showConfirmPassword ? 'Esconder confirmação de senha' : 'Mostrar confirmação de senha'}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" strokeWidth={2} /> : <Eye className="h-5 w-5" strokeWidth={2} />}
          </button>
        </div>
      </div>

      <div className="mt-1 flex w-full flex-col gap-2.5">
        <span className="text-xs font-semibold text-brand-secondary">
          Sua senha deve ter:
        </span>
        <div className="flex flex-col gap-2">
          {passwordRules.map((rule, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs transition-colors duration-200">
              <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${rule.valid ? 'text-brand-dark' : 'text-brand-secondary/45'}`}>
                {rule.valid ? (
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-current opacity-60" />
                )}
              </span>
              <span className={rule.valid ? 'text-brand-dark' : 'text-brand-secondary/70'}>
                {rule.label}
              </span>
            </div>
          ))}
        </div>
      </div>

        {status && (
          <div
          className={`${statusBaseClass} ${status.type === 'success' ? 'border-brand-dark bg-brand-accent text-brand-dark' : 'border-red-300 bg-red-50 text-[var(--color-error)]'}`}
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
        className={submitButtonClass}
      >
        {loading ? 'Enviando código...' : 'Criar conta'}
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-current" /> : <CheckCircle2 className="h-5 w-5 text-current" strokeWidth={2.3} />}
      </button>

      <p className="w-full text-center text-xs leading-5 text-brand-secondary">
        Ao continuar, você concorda com os{' '}
        <Link href="/terms" className="font-semibold text-brand-dark underline underline-offset-4">
          Termos de uso
        </Link>{' '}
        e a{' '}
        <Link href="/privacy" className="font-semibold text-brand-dark underline underline-offset-4">
          Privacidade
        </Link>
        .
      </p>
    </form>
  )
}

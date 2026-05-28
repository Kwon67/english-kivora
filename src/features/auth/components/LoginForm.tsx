'use client'

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HelpCircle, Loader2, X } from 'lucide-react'
import { loginSchema } from '@/lib/schemas'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { m, AnimatePresence, Variants } from 'framer-motion'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1]
    }
  }
}


const MFA_KNOWN_KEY = 'mfa_known_emails'

function getMfaKnownEmails(): string[] {
  try {
    return JSON.parse(localStorage.getItem(MFA_KNOWN_KEY) || '[]')
  } catch {
    return []
  }
}

function addMfaKnownEmail(email: string) {
  const emails = getMfaKnownEmails()
  const normalized = email.trim().toLowerCase()
  if (!emails.includes(normalized)) {
    emails.push(normalized)
    localStorage.setItem(MFA_KNOWN_KEY, JSON.stringify(emails))
  }
}

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const startedAtRef = useRef(0)
  const router = useRouter()

  useEffect(() => {
    startedAtRef.current = Date.now()
  }, [])

  const checkMfaForEmail = useCallback((email: string) => {
    if (!email) return
    const normalized = email.trim().toLowerCase()
    const knownEmails = getMfaKnownEmails()
    if (knownEmails.includes(normalized)) {
      setMfaEnabled(true)
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    const website = formData.get('website') as string

    const result = loginSchema.safeParse({ username, password })
    if (!result.success) {
      setError(result.error.issues[0].message)
      setLoading(false)
      return
    }

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, website, startedAt: startedAtRef.current }),
    }).catch(() => null)
    const loginResult = response ? await response.json().catch(() => null) : null

    if (!response?.ok || !loginResult?.success) {
      setError(loginResult?.error || 'Falha ao entrar')
      setLoading(false)
      return
    }

    const redirectUrl = typeof loginResult.redirectUrl === 'string' ? loginResult.redirectUrl : '/home'

    // Remember this email as MFA-enabled for future logins
    if (redirectUrl === '/login/mfa') {
      const formData2 = new FormData(event.currentTarget)
      const emailForMfa = formData2.get('username') as string
      if (emailForMfa) addMfaKnownEmail(emailForMfa)
    }

    router.push(redirectUrl, { transitionTypes: navForwardTransitionTypes })
  }

  return (
    <>
      <m.form
        onSubmit={handleSubmit}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="LoginForm w-full max-w-96 flex flex-col justify-start items-start gap-6"
      >
        {/* Honeypot field */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        {/* Email Address */}
        <m.div variants={itemVariants} data-layer="Email Field" className="EmailField self-stretch flex flex-col justify-start items-start gap-2 w-full">
          <div data-layer="Label" className="Label self-stretch flex flex-col justify-start items-start">
            <label
              htmlFor="username"
              className="EmailAddress self-stretch justify-center text-sm font-semibold font-inter leading-5 cursor-pointer"
              style={{ color: 'var(--color-text)' }}
            >
              Email Address
            </label>
          </div>
          <div data-layer="Container" className="Container self-stretch relative flex flex-col justify-start items-start w-full">
            <div
              data-layer="Input"
              className="Input self-stretch pl-10 pr-4 py-3.5 bg-gray-50/20 rounded-[32px] outline outline-1 outline-offset-[-1px] outline-stone-300 inline-flex justify-center items-start overflow-hidden focus-within:outline-2 w-full transition-all focus-within:shadow-[0_0_12px_rgba(39,99,86,0.12)] focus-within:bg-white/50"
              style={{
                outlineColor: 'var(--color-border)',
              }}
            >
              <div data-layer="Container" className="Container flex-1 inline-flex flex-col justify-start items-start overflow-hidden w-full">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="learner@example.com"
                  data-testid="login-username"
                  onBlur={(e) => checkMfaForEmail(e.target.value)}
                  className="w-full bg-transparent outline-none border-none p-0 text-base font-normal font-inter focus:ring-0 focus:outline-none"
                  style={{ color: 'var(--color-text)', '--tw-placeholder-color': 'var(--color-text-subtle)' } as React.CSSProperties}
                />
              </div>
            </div>
            <div data-layer="Container" className="Container h-12 pl-3 left-0 top-0 absolute inline-flex justify-start items-center pointer-events-none">
              <div data-svg-wrapper data-layer="Container" className="Container">
                <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 16C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H18C18.55 0 19.0208 0.195833 19.4125 0.5875C19.8042 0.979167 20 1.45 20 2V14C20 14.55 19.8042 15.0208 19.4125 15.4125C19.0208 15.8042 18.55 16 18 16H2ZM10 9L2 4V14H18V4L10 9ZM10 7L18 2H2L10 7ZM2 4V2V4V14V4Z" fill="var(--color-text-subtle)"/>
                </svg>
              </div>
            </div>
          </div>
        </m.div>

        {/* Password */}
        <m.div variants={itemVariants} data-layer="Password Field" className="PasswordField self-stretch flex flex-col justify-start items-start gap-2 w-full">
          <div data-layer="Container" className="Container self-stretch inline-flex justify-between items-center w-full">
            <div data-layer="Label" className="Label inline-flex flex-col justify-start items-start">
              <label
                htmlFor="password"
                className="Text justify-center text-sm font-semibold font-inter leading-5 cursor-pointer"
                style={{ color: 'var(--color-text)' }}
              >
                Password
              </label>
            </div>
            <div data-layer="Link" className="Link inline-flex flex-col justify-start items-start">
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="Forgot justify-center text-xs font-medium font-inter leading-4 hover:underline cursor-pointer focus:outline-none"
                style={{ color: 'var(--color-primary)' }}
              >
                Forgot?
              </button>
            </div>
          </div>
          <div data-layer="Container" className="Container self-stretch relative flex flex-col justify-start items-start w-full">
            <div
              data-layer="Input"
              className="Input self-stretch pl-10 pr-10 py-3.5 bg-gray-50/20 rounded-[32px] shadow-[inset_0px_2px_4px_1px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-stone-300 inline-flex justify-center items-start overflow-hidden focus-within:outline-2 w-full transition-all focus-within:shadow-[0_0_12px_rgba(39,99,86,0.12)] focus-within:bg-white/50"
              style={{
                outlineColor: 'var(--color-border)',
              }}
            >
              <div data-layer="Container" className="Container flex-1 inline-flex flex-col justify-start items-start overflow-hidden w-full">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  data-testid="login-password"
                  className="w-full bg-transparent outline-none border-none p-0 text-base font-normal font-inter focus:ring-0 focus:outline-none"
                  style={{ color: 'var(--color-text)', '--tw-placeholder-color': 'var(--color-text-subtle)' } as React.CSSProperties}
                />
              </div>
            </div>
            <div data-layer="Container" className="Container h-12 pl-3 left-0 top-0 absolute inline-flex justify-start items-center pointer-events-none">
              <div data-svg-wrapper data-layer="Container" className="Container">
                <svg width="16" height="21" viewBox="0 0 16 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 21C1.45 21 0.979167 20.8042 0.5875 20.4125C0.195833 20.0208 0 19.55 0 19V9C0 8.45 0.195833 7.97917 0.5875 7.5875C0.979167 7.19583 1.45 7 2 7H3V5C3 3.61667 3.4875 2.4375 4.4625 1.4625C5.4375 0.4875 6.61667 0 8 0C9.38333 0 10.5625 0.4875 11.5375 1.4625C12.5125 2.4375 13 3.61667 13 5V7H14C14.55 7 15.0208 7.19583 15.4125 7.5875C15.8042 7.97917 16 8.45 16 9V19C16 19.55 15.8042 20.0208 15.4125 20.4125C15.0208 20.8042 14.55 21 14 21H2ZM2 19H14V9H2V19ZM8 16C8.55 16 9.02083 15.8042 9.4125 15.4125C9.80417 15.0208 10 14.55 10 14C10 13.45 9.80417 12.9792 9.4125 12.5875C9.02083 12.1958 8.55 12 8 12C7.45 12 6.97917 12.1958 6.5875 12.5875C6.19583 12.9792 6 13.45 6 14C6 14.55 6.19583 15.0208 6.5875 15.4125C6.97917 15.8042 7.45 16 8 16ZM5 7H11V5C11 4.16667 10.7083 3.45833 10.125 2.875C9.54167 2.29167 8.83333 2 8 2C7.16667 2 6.45833 2.29167 5.875 2.875C5.29167 3.45833 5 4.16667 5 5V7ZM2 19V9V19Z" fill="var(--color-text-subtle)"/>
                </svg>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="h-12 pr-3 right-0 top-0 absolute inline-flex justify-start items-center cursor-pointer focus:outline-none"
              aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
            >
              <div data-svg-wrapper data-layer="Container" className="Container">
                {showPassword ? (
                  <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 3.2C12.9167 3.2 14.6542 3.69583 16.2125 4.6875C17.7708 5.67917 18.9667 7.01667 19.8 8.7C18.9667 10.3833 17.7708 11.7208 16.2125 12.7125C14.6542 13.7042 12.9167 14.2 11 14.2C9.08333 14.2 7.34583 13.7042 5.7875 12.7125C4.22917 11.7208 3.03333 10.3833 2.2 8.7C2.48333 8.1 2.825 7.54167 3.225 7.025C3.625 6.50833 4.06667 6.03333 4.55 5.6C5.03333 5.16667 5.5375 4.8 6.0625 4.5C6.5875 4.2 7.125 3.96667 7.675 3.8C8.225 3.63333 8.775 3.51667 9.325 3.45C9.875 3.38333 10.4333 3.35 11 3.2ZM11 1.2C8.48333 1.2 6.24167 1.89583 4.275 3.2875C2.30833 4.67917 0.883333 6.48333 0 8.7C0.883333 10.9167 2.30833 12.7208 4.275 14.1125C6.24167 15.5042 8.48333 16.2 11 16.2C13.5167 16.2 15.7583 15.5042 17.725 14.1125C19.6917 12.7208 21.1167 10.9167 22 8.7C21.1167 6.48333 19.6917 4.67917 17.725 3.2875C15.7583 1.89583 13.5167 1.2 11 1.2ZM11 5.2C11.9667 5.2 12.7875 5.5375 13.4625 6.2125C14.1375 6.8875 14.475 7.70833 14.475 8.7C14.475 9.69167 14.1375 10.5125 13.4625 11.1875C12.7875 11.8625 11.9667 12.2 11 12.2C10.0333 12.2 9.2125 11.8625 8.5375 11.1875C7.8625 10.5125 7.525 9.69167 7.525 8.7C7.525 7.70833 7.8625 6.8875 8.5375 6.2125C9.2125 5.5375 10.0333 5.2 11 5.2ZM11 7.2C10.5833 7.2 10.2292 7.34583 9.9375 7.6375C9.64583 7.92917 9.5 8.28333 9.5 8.7C9.5 9.11667 9.64583 9.47083 9.9375 9.7625C10.2292 10.0542 10.5833 10.2 11 10.2C11.4167 10.2 11.7708 10.0542 12.0625 9.7625C12.3542 9.47083 12.5 9.11667 12.5 8.7C12.5 8.28333 12.3542 7.92917 12.0625 7.6375C11.7708 7.34583 11.4167 7.2 11 7.2Z" fill="#00A85F"/>
                  </svg>
                ) : (
                  <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.1 10.5L13.65 9.05C13.8 8.26667 13.575 7.53333 12.975 6.85C12.375 6.16667 11.6 5.9 10.65 6.05L9.2 4.6C9.48333 4.46667 9.77083 4.36667 10.0625 4.3C10.3542 4.23333 10.6667 4.2 11 4.2C12.25 4.2 13.3125 4.6375 14.1875 5.5125C15.0625 6.3875 15.5 7.45 15.5 8.7C15.5 9.03333 15.4667 9.34583 15.4 9.6375C15.3333 9.92917 15.2333 10.2167 15.1 10.5ZM18.3 13.65L16.85 12.25C17.4833 11.7667 18.0458 11.2375 18.5375 10.6625C19.0292 10.0875 19.45 9.43333 19.8 8.7C18.9667 7.01667 17.7708 5.67917 16.2125 4.6875C14.6542 3.69583 12.9167 3.2 11 3.2C10.5167 3.2 10.0417 3.23333 9.575 3.3C9.10833 3.36667 8.65 3.46667 8.2 3.6L6.65 2.05C7.33333 1.76667 8.03333 1.55417 8.75 1.4125C9.46667 1.27083 10.2167 1.2 11 1.2C13.5167 1.2 15.7583 1.89583 17.725 3.2875C19.6917 4.67917 21.1167 6.48333 22 8.7C21.6167 9.68333 21.1125 10.5958 20.4875 11.4375C19.8625 12.2792 19.1333 13.0167 18.3 13.65ZM18.8 19.8L14.6 15.65C14.0167 15.8333 13.4292 15.9708 12.8375 16.0625C12.2458 16.1542 11.6333 16.2 11 16.2C8.48333 16.2 6.24167 15.5042 4.275 14.1125C2.30833 12.7208 0.883333 10.9167 0 8.7C0.35 7.81667 0.791667 6.99583 1.325 6.2375C1.85833 5.47917 2.46667 4.8 3.15 4.2L0.4 1.4L1.8 0L20.2 18.4L18.8 19.8ZM4.55 5.6C4.06667 6.03333 3.625 6.50833 3.225 7.025C2.825 7.54167 2.48333 8.1 2.2 8.7C3.03333 10.3833 4.22917 11.7208 5.7875 12.7125C7.34583 13.7042 9.08333 14.2 11 14.2C11.3333 14.2 11.6583 14.1792 11.975 14.1375C12.2917 14.0958 12.6167 14.05 12.95 14L12.05 13.05C11.8667 13.1 11.6917 13.1375 11.525 13.1625C11.3583 13.1875 11.1833 13.2 11 13.2C9.75 13.2 8.6875 12.7625 7.8125 11.8875C6.9375 11.0125 6.5 9.95 6.5 8.7C6.5 8.51667 6.5125 8.34167 6.5375 8.175C6.5625 8.00833 6.6 7.83333 6.65 7.65L4.55 5.6Z" fill="var(--color-text-subtle)"/>
                  </svg>
                )}
              </div>
            </button>
          </div>
        </m.div>

        {/* MFA */}
        <m.div
          variants={itemVariants}
          data-layer="MFA Option (Gamified switch)"
          className="MfaOptionGamifiedSwitch self-stretch p-3 bg-zinc-100/20 rounded-[32px] outline outline-1 outline-offset-[-1px] outline-zinc-200 inline-flex justify-between items-center w-full"
        >
          <div data-layer="Container" className="Container flex justify-start items-center gap-3">
            <div
              data-layer="Background"
              className="Background w-8 h-8 rounded-full flex justify-center items-center"
              style={{ background: 'var(--color-surface-container-high)' }}
            >
              <div data-svg-wrapper data-layer="Container" className="Container">
                <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 15C4.2625 14.5625 2.82812 13.5656 1.69687 12.0094C0.565625 10.4531 0 8.725 0 6.825V2.25L6 0L12 2.25V6.825C12 8.725 11.4344 10.4531 10.3031 12.0094C9.17188 13.5656 7.7375 14.5625 6 15ZM6 13.425C7.2125 13.05 8.225 12.3094 9.0375 11.2031C9.85 10.0969 10.325 8.8625 10.4625 7.5H6V1.59375L1.5 3.28125V6.825C1.5 6.9625 1.5 7.075 1.5 7.1625C1.5 7.25 1.5125 7.3625 1.5375 7.5H6V13.425Z" fill="#00A85F"/>
                </svg>
              </div>
            </div>
            <div data-layer="Container" className="Container inline-flex flex-col justify-start items-start">
              <div data-layer="Container" className="Container self-stretch flex flex-col justify-start items-start">
                <div data-layer="Text" className="Text justify-center text-sm font-semibold font-inter leading-5" style={{ color: 'var(--color-text)' }}>Verificação de duas etapas</div>
              </div>
              <div data-layer="Container" className="Container self-stretch flex flex-col justify-start items-start">
                <div data-layer="Text" className="Text justify-center text-xs font-medium font-inter leading-4" style={{ color: 'var(--color-text-muted)' }}>Recommended for security</div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMfaEnabled(!mfaEnabled)}
            className="relative w-11 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            style={{ backgroundColor: mfaEnabled ? '#00A85F' : 'var(--color-surface-container-highest)' }}
            role="switch"
            aria-checked={mfaEnabled}
          >
            <m.div
              className="w-5 h-5 rounded-full bg-white shadow-sm border border-gray-200"
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              animate={{ x: mfaEnabled ? 20 : 0 }}
            />
          </button>
        </m.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <m.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              data-testid="login-error"
              className="w-full rounded-[0.75rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-[var(--color-error)] overflow-hidden"
            >
              {error}
            </m.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <m.div variants={itemVariants} className="w-full">
          <m.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.015, translateY: -1 }}
            whileTap={{ scale: 0.985, translateY: 0 }}
            data-testid="login-submit"
            className="ActionButton self-stretch py-4 bg-emerald-800 rounded-[32px] shadow-[0px_8px_15px_0px_rgba(0,0,0,0.10)] shadow-[0px_4px_8.5px_0px_rgba(202,202,202,1.00)] inline-flex justify-center items-center gap-2 overflow-hidden w-full cursor-pointer hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <span data-layer="Vamos lá!" className="VamosL text-center justify-center text-white text-2xl font-bold font-montserrat leading-8">
              {loading ? "Entrando..." : "Vamos lá!"}
            </span>
            <div data-svg-wrapper data-layer="Container" className="Container flex items-center justify-center">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z" fill="white"/>
                </svg>
              )}
            </div>
          </m.button>
        </m.div>

        {/* Footer */}
        <m.div variants={itemVariants} data-layer="Paragraph" className="Paragraph self-stretch px-11 inline-flex justify-between items-baseline w-full">
          <div data-layer="Novo no Kivora?" className="NovoNoKivora text-center justify-center text-base font-normal font-inter leading-6" style={{ color: 'var(--color-text-muted)' }}>Novo no Kivora? </div>
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="FaleConosco text-right text-sm font-semibold font-inter leading-6 hover:underline cursor-pointer focus:outline-none"
            style={{ color: 'var(--color-primary)' }}
          >
            Fale conosco
          </button>
        </m.div>
      </m.form>

      {/* Forgot Password support dialog */}
      <AnimatePresence>
        {forgotOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 p-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
            onClick={(e) => { if (e.target === e.currentTarget) setForgotOpen(false) }}
          >
            <m.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-sm rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-xl)]"
            >
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-text)]"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                  <HelpCircle className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <h2 id="forgot-password-title" className="text-lg font-semibold text-[var(--color-text)]">
                    Recuperação de senha
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">Suporte manual</p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                A redefinição de senha ainda não está disponível nesta versão. Entre em contato com o desenvolvedor para solicitar ajuda com sua conta.
              </p>

              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="btn-primary mt-6 w-full py-3 text-sm"
              >
                Entendi
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}


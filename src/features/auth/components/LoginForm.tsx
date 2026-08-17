'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Eye, EyeOff, HelpCircle, Loader2, Lock, Mail, Shield, X } from 'lucide-react';
import { loginSchema } from '@/lib/schemas';
import { linkPrimary } from '@/lib/brandUi';
import { m, AnimatePresence, Variants } from 'framer-motion';
import ModalPortal from '@/components/ui/ModalPortal';
import {
  isMfaKnownIdentifier,
  rememberMfaKnownIdentifier,
} from '@/features/auth/lib/mfaKnownIdentifiers';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

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
};


type LoginFormProps = {
  ve30wlhpaClassName?: string
}

export default function LoginForm({ ve30wlhpaClassName }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const startedAtRef = useRef(0);
  const isRedirectingRef = useRef(false);
  const submitInFlightRef = useRef(false);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  const checkMfaForEmail = useCallback((email: string) => {
    if (!email) return;
    void isMfaKnownIdentifier(email).then((known) => {
      if (known) setMfaEnabled(true);
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitInFlightRef.current || isRedirectingRef.current) {
      return;
    }

    submitInFlightRef.current = true;
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;
      const website = formData.get('website') as string;

      const result = loginSchema.safeParse({ username, password });
      if (!result.success) {
        setError(result.error.issues[0].message);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, website, startedAt: startedAtRef.current })
      }).catch(() => null);
      const loginResult = response ? await response.json().catch(() => null) : null;

      if (!response?.ok || !loginResult?.success) {
        if (isRedirectingRef.current) return;
        setError(loginResult?.error || 'Falha ao entrar');
        setLoading(false);
        return;
      }

      const redirectUrl = typeof loginResult.redirectUrl === 'string' ? loginResult.redirectUrl : '/home';

      if (redirectUrl === '/login/mfa' && username) {
        void rememberMfaKnownIdentifier(username);
      }

      isRedirectingRef.current = true;
      setError(null);
      window.location.replace(redirectUrl);
    } finally {
      if (!isRedirectingRef.current) {
        submitInFlightRef.current = false;
      }
    }
  }

  return (
    <>
      <m.form
        onSubmit={handleSubmit}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="LoginForm w-full max-w-96 flex flex-col justify-start items-start gap-6">
        
        {/* Honeypot field */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden" />
        

        {/* Email Address */}
        <m.div variants={itemVariants} data-layer="Email Field" className="EmailField self-stretch flex flex-col justify-start items-start gap-2 w-full">
          <div data-layer="Label" className="Label self-stretch flex flex-col justify-start items-start">
            <label
              htmlFor="username"
              className="EmailAddress self-stretch justify-center text-sm font-semibold font-inter leading-5 cursor-pointer"
              style={{ color: 'var(--color-text)' }}>
              
              Email Address
            </label>
          </div>
          <div data-layer="Container" className="Container self-stretch relative flex flex-col justify-start items-start w-full">
            <div
              data-layer="Input"
              className="Input self-stretch pl-10 pr-4 py-3.5 bg-gray-50/20 rounded-[32px] outline outline-1 outline-offset-[-1px] outline-stone-300 inline-flex justify-center items-start overflow-hidden focus-within:outline-2 w-full transition-all focus-within:shadow-[0_0_12px_rgba(39,99,86,0.12)] focus-within:bg-white/50"
              style={{
                outlineColor: 'var(--color-border)'
              }}>
              
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
                  className={ve30wlhpaClassName || "w-full bg-transparent outline-none border-none p-0 text-base font-normal font-inter focus:ring-0 focus:outline-none"}
                  style={{ color: 'var(--color-text)', '--tw-placeholder-color': 'var(--color-text-subtle)' } as React.CSSProperties} />
                
              </div>
            </div>
            <div data-layer="Container" className="Container h-12 pl-3 left-0 top-0 absolute inline-flex justify-start items-center pointer-events-none">
              <div data-svg-wrapper data-layer="Container" className="Container">
                <Mail className="h-5 w-5 text-text-subtle" aria-hidden="true" />
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
                style={{ color: 'var(--color-text)' }}>
                
                Password
              </label>
            </div>
            <div data-layer="Link" className="Link inline-flex flex-col justify-start items-start">
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className={`Forgot justify-center text-xs font-medium font-inter leading-4 cursor-pointer focus:outline-none ${linkPrimary}`}>
                
                Forgot?
              </button>
            </div>
          </div>
          <div data-layer="Container" className="Container self-stretch relative flex flex-col justify-start items-start w-full">
            <div
              data-layer="Input"
              className="Input self-stretch pl-10 pr-10 py-3.5 bg-gray-50/20 rounded-[32px] shadow-[inset_0px_2px_4px_1px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-stone-300 inline-flex justify-center items-start overflow-hidden focus-within:outline-2 w-full transition-all focus-within:shadow-[0_0_12px_rgba(39,99,86,0.12)] focus-within:bg-white/50"
              style={{
                outlineColor: 'var(--color-border)'
              }}>
              
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
                  style={{ color: 'var(--color-text)', '--tw-placeholder-color': 'var(--color-text-subtle)' } as React.CSSProperties} />
                
              </div>
            </div>
            <div data-layer="Container" className="Container h-12 pl-3 left-0 top-0 absolute inline-flex justify-start items-center pointer-events-none">
              <div data-svg-wrapper data-layer="Container" className="Container">
                <Lock className="h-5 w-5 text-text-subtle" aria-hidden="true" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center focus:outline-none"
              aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}>
              <span data-svg-wrapper data-layer="Container" className="inline-flex items-center justify-center">
                {showPassword ?
                <Eye className="h-5 w-5 text-[#065f46]" aria-hidden="true" /> :

                <EyeOff className="h-5 w-5 text-text-subtle" aria-hidden="true" />
                }
              </span>
            </button>
          </div>
        </m.div>

        {/* MFA */}
        <m.div
          variants={itemVariants}
          data-layer="MFA Option (Gamified switch)"
          className="MfaOptionGamifiedSwitch self-stretch p-3 bg-zinc-100/20 rounded-[32px] outline outline-1 outline-offset-[-1px] outline-zinc-200 inline-flex justify-between items-center w-full">
          
          <div data-layer="Container" className="Container flex justify-start items-center gap-3">
            <div
              data-layer="Background"
              className="Background w-8 h-8 rounded-full flex justify-center items-center"
              style={{ background: 'var(--color-surface-container-high)' }}>
              
              <div data-svg-wrapper data-layer="Container" className="Container text-primary">
                <Shield className="h-4 w-4" aria-hidden="true" />
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
            className="relative inline-flex h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
            style={{ backgroundColor: mfaEnabled ? 'var(--color-primary)' : 'var(--color-surface-container-highest)' }}
            role="switch"
            aria-checked={mfaEnabled}>
            <m.span
              aria-hidden="true"
              className="pointer-events-none absolute top-0.5 left-0.5 block h-5 w-5 rounded-full border border-gray-200 bg-white shadow-sm"
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              animate={{ x: mfaEnabled ? 20 : 0 }}
            />
          </button>
        </m.div>

        {/* Error message */}
        <AnimatePresence>
          {error &&
          <m.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            data-testid="login-error"
            className="w-full rounded-[0.75rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-[var(--color-error)] overflow-hidden">
            
              {error}
            </m.div>
          }
        </AnimatePresence>

        {/* Submit Button */}
        <m.div variants={itemVariants} className="w-full">
          <m.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.015, translateY: -1 }}
            whileTap={{ scale: 0.985, translateY: 0 }}
            data-testid="login-submit"
            className="ActionButton self-stretch py-4 bg-primary rounded-[32px] shadow-[0px_8px_15px_0px_rgba(28, 25, 21,0.15)] inline-flex justify-center items-center gap-2 overflow-hidden w-full cursor-pointer hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/40">
            
            <span data-layer="Vamos lá!" className="VamosL text-center justify-center text-white text-2xl font-bold font-montserrat leading-8">
              {loading ? "Entrando..." : "Vamos lá!"}
            </span>
            <div data-svg-wrapper data-layer="Container" className="Container flex items-center justify-center text-white">
              {loading ?
              <Loader2 className="w-4 h-4 animate-spin" /> :

              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              }
            </div>
          </m.button>
        </m.div>

        {/* Footer */}
        <m.div variants={itemVariants} data-layer="Paragraph" className="Paragraph self-stretch px-11 inline-flex justify-between items-baseline w-full">
          <div data-layer="Novo no Kivora?" className="NovoNoKivora text-center justify-center text-base font-normal font-inter leading-6" style={{ color: 'var(--color-text-muted)' }}>Novo no Kivora? </div>
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className={`FaleConosco text-right text-sm font-semibold font-inter leading-6 cursor-pointer focus:outline-none ${linkPrimary}`}>
            
            Fale conosco
          </button>
        </m.div>
      </m.form>

      {/* Forgot Password support dialog */}
      <AnimatePresence>
        {forgotOpen && (
        <ModalPortal
          onClose={() => setForgotOpen(false)}
          className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center overflow-y-auto overscroll-contain bg-white/8 p-4 backdrop-blur-2xl"
        >
            <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative my-auto w-full max-w-sm rounded-[28px] border border-border bg-surface p-6 shadow-[var(--shadow-xl)]">
            
              <button
              type="button"
              onClick={() => setForgotOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-text-subtle transition-colors hover:bg-surface-container-low hover:text-text"
              aria-label="Fechar">
              
                <X className="h-5 w-5" />
              </button>

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary">
                  <HelpCircle className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <h2 id="forgot-password-title" className="text-lg font-semibold text-text">
                    Recuperação de senha
                  </h2>
                  <p className="text-xs text-text-muted">Suporte manual</p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-text-muted">
                A redefinição de senha ainda não está disponível nesta versão. Entre em contato com o desenvolvedor para solicitar ajuda com sua conta.
              </p>

              <button
              type="button"
              onClick={() => setForgotOpen(false)}
              className="btn-primary mt-6 w-full py-3 text-sm">
              
                Entendi
              </button>
            </m.div>
        </ModalPortal>
        )}
      </AnimatePresence>
    </>);

}

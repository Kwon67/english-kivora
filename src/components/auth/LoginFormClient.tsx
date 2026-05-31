'use client';

import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { AnimatePresence, m, type Variants } from 'framer-motion';
import EmailInput from '@/components/auth/EmailInput';
import LoginSubmitButton from '@/components/auth/LoginSubmitButton';
import PasswordInput from '@/components/auth/PasswordInput';
import Toggle2FA from '@/components/auth/Toggle2FA';
import { loginSchema } from '@/lib/schemas';

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

const MFA_KNOWN_KEY = 'mfa_known_emails';

function getMfaKnownEmails(): string[] {
  try {
    return JSON.parse(localStorage.getItem(MFA_KNOWN_KEY) || '[]');
  } catch {
    return [];
  }
}

function addMfaKnownEmail(email: string) {
  const emails = getMfaKnownEmails();
  const normalized = email.trim().toLowerCase();

  if (!emails.includes(normalized)) {
    emails.push(normalized);
    localStorage.setItem(MFA_KNOWN_KEY, JSON.stringify(emails));
  }
}

export default function LoginFormClient() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [mfaSuggested, setMfaSuggested] = useState(false);
  const startedAtRef = useRef(0);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  const checkMfaForEmail = useCallback((email: string) => {
    if (!email) return;

    const normalized = email.trim().toLowerCase();
    const knownEmails = getMfaKnownEmails();

    if (knownEmails.includes(normalized)) {
      setMfaSuggested(true);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

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
      setError(loginResult?.error || 'Falha ao entrar');
      setLoading(false);
      return;
    }

    const redirectUrl = typeof loginResult.redirectUrl === 'string' ? loginResult.redirectUrl : '/home';

    if (redirectUrl === '/login/mfa' && username) {
      addMfaKnownEmail(username);
    }

    window.location.replace(redirectUrl);
  }

  return (
    <>
      <m.form
        onSubmit={handleSubmit}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="LoginForm w-full max-w-96 flex flex-col justify-start items-start gap-6">
        
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden" />
        

        <m.div variants={itemVariants} className="w-full">
          <EmailInput onBlurEmail={checkMfaForEmail} label="Email Address ✧" veZ1vbjlaClassName="EmailAddress self-stretch justify-center text-sm font-semibold font-inter leading-5 cursor-pointer" />
        </m.div>

        <m.div variants={itemVariants} className="w-full">
          <PasswordInput onForgotPassword={() => setForgotOpen(true)} />
        </m.div>

        <m.div variants={itemVariants} className="w-full">
          <Toggle2FA suggestedEnabled={mfaSuggested} />
        </m.div>

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

        <m.div variants={itemVariants} className="w-full">
          <LoginSubmitButton loading={loading} />
        </m.div>

        <m.div variants={itemVariants} data-layer="Paragraph" className="Paragraph self-stretch px-11 inline-flex justify-between items-baseline w-full">
          <div data-layer="Novo no Kivora?" className="NovoNoKivora text-center justify-center text-base font-normal font-inter leading-6" style={{ color: 'var(--color-text-muted)' }}>Novo no Kivora? </div>
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="FaleConosco text-right text-sm font-semibold font-inter leading-6 hover:underline cursor-pointer focus:outline-none"
            style={{ color: 'var(--color-primary)' }}>
            
            Fale conosco
          </button>
        </m.div>
      </m.form>

      <AnimatePresence>
        {forgotOpen &&
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/8 p-4 backdrop-blur-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-password-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setForgotOpen(false);
          }}>
          
            <m.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-sm rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-xl)]">
            
              <button
              type="button"
              onClick={() => setForgotOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-text)]"
              aria-label="Fechar">
              
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
              className="btn-primary mt-6 w-full py-3 text-sm">
              
                Entendi
              </button>
            </m.div>
          </m.div>
        }
      </AnimatePresence>
    </>);

}
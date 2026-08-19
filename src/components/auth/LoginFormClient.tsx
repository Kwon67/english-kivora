'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, m, type Variants } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import EmailInput from '@/components/auth/EmailInput';
import LoginSubmitButton from '@/components/auth/LoginSubmitButton';
import PasswordInput from '@/components/auth/PasswordInput';
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

export default function LoginFormClient() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const startedAtRef = useRef(0);
  const isRedirectingRef = useRef(false);
  const submitInFlightRef = useRef(false);

  useEffect(() => {
    startedAtRef.current = Date.now();
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
        className="LoginForm w-full flex flex-col justify-start items-start gap-4">
        
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden" />
        

        <m.div variants={itemVariants} className="w-full">
          <EmailInput />
        </m.div>

        <m.div variants={itemVariants} className="w-full">
          <PasswordInput />
        </m.div>

        <AnimatePresence>
          {error &&
          <m.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            data-testid="login-error"
            className="flex w-full items-start gap-3 overflow-hidden rounded-[20px] border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-[var(--color-error)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.3} />
            <span>{error}</span>
            </m.div>
          }
        </AnimatePresence>

        <m.div variants={itemVariants} className="w-full mt-2">
          <LoginSubmitButton loading={loading} />
        </m.div>

        <m.div variants={itemVariants} className="w-full mt-4">
          <p className="text-center text-xs leading-5 text-brand-secondary w-full">
            Ao entrar, você concorda com os{' '}
            <Link href="/terms" className="font-semibold text-brand-dark underline underline-offset-4">
              Termos de uso
            </Link>{' '}
            e a{' '}
            <Link href="/privacy" className="font-semibold text-brand-dark underline underline-offset-4">
              Privacidade
            </Link>
            .
          </p>
        </m.div>
      </m.form>
    </>);

}

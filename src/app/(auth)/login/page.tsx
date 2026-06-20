import Link from 'next/link';
import { X } from 'lucide-react';
import LoginFormClient from '@/components/auth/LoginFormClient';
import FlightPaths from '@/components/landing/FlightPaths';
import { pageBgGlow, pageBgGrid } from '@/lib/pageShellBackground';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-surface p-4 text-start text-base font-normal leading-6 text-text select-none dark:bg-[#050704] dark:text-text md:items-center md:p-8">
      <div className={pageBgGrid} />
      <div className={pageBgGlow} />

      {/* Decorative flight-path background */}
      <FlightPaths />

      {/* Responsive unified container card - Styled EXACTLY like the reference image */}
      <div
        className="animate-fade-slide-up relative z-10 flex w-full max-w-[440px] flex-col items-stretch justify-start overflow-hidden rounded-[32px] border border-border-muted/20 bg-card p-6 pt-16 text-start text-base font-normal leading-6 tracking-normal text-text opacity-100 shadow-[0_24px_70px_rgba(31,43,18,0.16)] dark:border-border-accent/20 dark:bg-card dark:text-text dark:shadow-[0_24px_70px_rgba(0,0,0,0.54)] sm:p-8 sm:pt-20">
        
        {/* Top left circular Close Button */}
        <Link
          href="/"
          className="absolute left-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-surface bg-primary/8 text-text-muted dark:text-text-muted hover:bg-hero-lime hover:bg-primary/16 transition-colors"
          aria-label="Voltar para a página inicial"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </Link>

        {/* Header styling matching the image: left-aligned */}
        <div className="flex flex-col justify-start items-start mb-6">
          <h1 className="font-montserrat text-[28px] font-bold leading-9 tracking-tight text-text dark:text-text">
            Entrar
          </h1>
          <p className="font-inter text-sm leading-6 text-text-muted dark:text-text-muted mt-1.5">
            Novo no Kivora?{' '}
            <Link href="/register" className="font-bold text-primary hover:underline">
              Criar conta
            </Link>
          </p>
        </div>

        {/* Login Form */}
        <div className="w-full">
          <LoginFormClient />
        </div>
      </div>

    </div>
  );
}

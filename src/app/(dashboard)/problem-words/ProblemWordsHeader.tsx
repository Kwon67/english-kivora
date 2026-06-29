'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Brain, Target } from 'lucide-react'
import { m } from 'framer-motion'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import { LibraryBadge, accentBadge, ghostBtn } from '@/features/profile/lib/libraryUi'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'

interface ProblemWordsHeaderProps {
  problemCount: number
  criticalCount: number
  almostMasteredCount: number
}

const glassTile =
  'render-contained relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[8px_8px_0_var(--color-brand-dark)] transition-all duration-300'
export default function ProblemWordsHeader({
  problemCount,
  criticalCount,
  almostMasteredCount,
}: ProblemWordsHeaderProps) {
  return (
    <header className={`${glassTile} relative overflow-hidden p-6 sm:p-8 lg:p-10 group`}>
      <div className="mb-5 relative z-10">
        <Link href="/home" transitionTypes={navBackTransitionTypes} className={`${ghostBtn} min-h-10`}>
          <ArrowLeft className="h-4 w-4" />
          Início
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center relative z-10">
        <div>
          <StudyBreadcrumb
            items={[
              { label: 'Início', href: '/home' },
              { label: 'Dificuldades' },
            ]}
            className="mb-4"
          />
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <LibraryBadge label="Revisão focada" />
            <span className={accentBadge}>Últimos 30 dias</span>
          </div>
          <h1 className="max-w-2xl font-heading text-4xl font-bold leading-tight tracking-tight text-brand-dark sm:text-5xl">
            Termos que precisam de atenção
          </h1>
          <p className="mt-5 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Cards que você errou nas sessões recentes. Pratique cada termo em revisão focada para subir sua precisão sem perder o ritmo diário.
          </p>

          <div className="mt-8 flex flex-wrap gap-3.5">
            <a href="#termos" className={ghostBtn}>
              <Brain className="h-4 w-4" />
              Ver termos
            </a>
            <Link href="/review" className={ghostBtn}>
              <Target className="h-4 w-4" />
              Revisão geral
            </Link>
          </div>
        </div>

        <m.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.15 }}
          className={`${glassTile} relative z-10 overflow-hidden p-5 hover:-translate-y-1 sm:p-6`}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <span className={accentBadge}>Resumo</span>
              <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
                {problemCount} {problemCount === 1 ? 'termo' : 'termos'} em foco
              </h2>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary">
                {criticalCount > 0
                  ? `${criticalCount} ${criticalCount === 1 ? 'marcado como crítico' : 'marcados como críticos'} por repetição de erros.`
                  : problemCount > 0
                    ? 'Nenhum termo crítico por enquanto — continue revisando para consolidar.'
                    : 'Quando errar cards nas sessões, eles aparecerão aqui.'}
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]">
              {criticalCount > 0 ? <AlertTriangle className="h-5 w-5" /> : <Brain className="h-5 w-5" />}
            </span>
          </div>

          <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[3px_3px_0_var(--color-brand-dark)]">
              <Brain className="h-4 w-4 text-brand-dark" />
              <p className="mt-3 font-heading text-2xl font-bold text-brand-dark">{problemCount}</p>
              <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">termos</p>
            </div>
            <div className="rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[3px_3px_0_var(--color-brand-dark)]">
              <AlertTriangle className="h-4 w-4 text-brand-dark" />
              <p className="mt-3 font-heading text-2xl font-bold text-brand-dark">{criticalCount}</p>
              <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">críticos</p>
            </div>
            <div className="rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[3px_3px_0_var(--color-brand-dark)]">
              <Target className="h-4 w-4 text-brand-dark" />
              <p className="mt-3 font-heading text-2xl font-bold text-brand-dark">{almostMasteredCount}</p>
              <p className="mt-1 font-body text-xs font-semibold text-brand-secondary">quase dominados</p>
            </div>
          </div>

          <div className="relative mt-5 flex min-h-[120px] items-center justify-center overflow-hidden rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[4px_4px_0_var(--color-brand-dark)]">
            <m.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-full max-w-[180px]"
            >
              <Image
                src="/images/home/undraw-studying.svg"
                alt="Ilustração de revisão focada"
                width={300}
                height={240}
                unoptimized
                priority
                className="mx-auto h-auto w-full object-contain filter drop-shadow-sm select-none"
              />
            </m.div>
          </div>
        </m.div>
      </div>
    </header>
  )
}

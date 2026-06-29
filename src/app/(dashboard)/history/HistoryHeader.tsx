'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BarChart3, BookOpen, Target } from 'lucide-react'
import { m } from 'framer-motion'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import { LibraryBadge, ghostBtn } from '@/features/profile/lib/libraryUi'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'

interface HistoryHeaderProps {
  totalSessions: number
  averageAccuracy: number
  filterDate?: string
}

const glassTile =
  'render-contained relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[8px_8px_0_var(--color-brand-dark)] transition-all duration-300'
const neutralBadge =
  'inline-flex items-center rounded-full border border-brand-dark bg-brand-accent px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'

export default function HistoryHeader({ totalSessions, averageAccuracy, filterDate }: HistoryHeaderProps) {
  const formattedFilterDate = filterDate
    ? filterDate.split('-').reverse().join('/')
    : null

  return (
    <header className={`${glassTile} relative overflow-hidden p-6 sm:p-8 lg:p-10 group`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 relative z-10">
        <Link
          href="/home"
          transitionTypes={navBackTransitionTypes}
          className={`${ghostBtn} min-h-10`}
        >
          <ArrowLeft className="h-4 w-4" />
          Início
        </Link>
        {formattedFilterDate ? (
          <span className={neutralBadge}>Filtro: {formattedFilterDate}</span>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center relative z-10">
        <div>
          <StudyBreadcrumb
            items={[
              { label: 'Início', href: '/home' },
              { label: 'Histórico' },
            ]}
            className="mb-4"
          />
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <LibraryBadge label="Análise de histórico" />
            <span className={neutralBadge}>Seu progresso</span>
          </div>
          <h1 className="max-w-2xl font-heading text-4xl font-bold leading-tight tracking-tight text-brand-dark sm:text-5xl">
            Análise de histórico
          </h1>
          <p className="mt-5 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Acompanhe precisão, retenção e consistência nas suas sessões. Use os gráficos para entender onde evoluir e o que revisar.
          </p>

          <div className="mt-8 flex flex-wrap gap-3.5">
            <a href="#graficos" className={ghostBtn}>
              <BarChart3 className="h-4 w-4" />
              Ver gráficos
            </a>
            <a href="#sessoes" className={ghostBtn}>
              <BookOpen className="h-4 w-4" />
              {totalSessions} {totalSessions === 1 ? 'sessão' : 'sessões'}
            </a>
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
              <span className={neutralBadge}>Consolidado</span>
              <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
                {averageAccuracy}% de precisão
              </h2>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary">
                {totalSessions > 0
                  ? `Média calculada a partir de ${totalSessions} ${totalSessions === 1 ? 'sessão registrada' : 'sessões registradas'}.`
                  : 'Jogue uma lição para começar a formar seu histórico.'}
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]">
              <Target className="h-5 w-5" />
            </span>
          </div>

          <div className="relative mt-5 flex min-h-[140px] items-center justify-center overflow-hidden rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[4px_4px_0_var(--color-brand-dark)]">
            <m.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-full max-w-[200px]"
            >
              <Image
                src="/images/home/undraw-online-learning.svg"
                alt="Ilustração de análise de histórico de estudos"
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

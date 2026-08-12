'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Brain, Search, Target } from 'lucide-react'
import { m } from 'framer-motion'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingRadius } from '@/lib/landingStyles'
import {
  problemWordsHero,
  problemWordsIconBox,
  problemWordsPill,
  problemWordsSoftBtn,
  problemWordsTile,
} from '@/features/review/lib/problemWordsUi'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'

interface ProblemWordsHeaderProps {
  problemCount: number
  criticalCount: number
}

export default function ProblemWordsHeader({
  problemCount,
  criticalCount,
}: ProblemWordsHeaderProps) {
  const focusLevel =
    criticalCount > 0 ? 'Alta prioridade' : problemCount > 0 ? 'Revisão focada' : 'Tudo limpo'

  return (
    <header className={`${problemWordsHero} p-4 sm:p-8 lg:p-10`}>
      <div className="relative z-10 mb-5">
        <Link href="/home" transitionTypes={navBackTransitionTypes} className={problemWordsSoftBtn}>
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Início
        </Link>
      </div>

      <div className="relative z-10 grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-8">
        <div className="min-w-0">
          <StudyBreadcrumb
            items={[
              { label: 'Início', href: '/home' },
              { label: 'Dificuldades' },
            ]}
            className="mb-4"
          />

          <div className="flex flex-wrap items-center gap-2">
            <SectionBadge label="Zona de foco" animate={false} />
            <span className={`${problemWordsPill} bg-brand-accent`}>{focusLevel}</span>
          </div>

          <h1 className="mt-5 max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl lg:text-5xl">
            Termos que precisam de atenção
          </h1>

          <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Cards que você errou nas sessões recentes, com a contagem completa logo abaixo. Cada termo pode ir direto
            para uma revisão focada — sem perder o ritmo da rotina.
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
            <a href="#termos" className={`${problemWordsSoftBtn} w-full sm:w-auto`}>
              <Search className="h-4 w-4 shrink-0" />
              Ver termos
            </a>
            <Link href="/review" transitionTypes={navForwardTransitionTypes} className={`${problemWordsSoftBtn} w-full sm:w-auto`}>
              <Target className="h-4 w-4 shrink-0" />
              Revisão geral
            </Link>
          </div>
        </div>

        <m.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.12, stiffness: 260, damping: 24 }}
          className={`${problemWordsTile} p-4 sm:p-6`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className={problemWordsPill}>Resumo 30 dias</span>
              <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
                Seu resumo
              </h2>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary sm:text-sm">
                {problemCount > 0
                  ? `${problemCount} ${problemCount === 1 ? 'termo em foco' : 'termos em foco'}, contagem completa abaixo.`
                  : 'Quando você errar cards nas sessões, eles aparecerão aqui.'}
              </p>
            </div>
            <div className={`h-11 w-11 shrink-0 ${problemWordsIconBox}`}>
              {criticalCount > 0 ? (
                <AlertTriangle className="h-5 w-5" strokeWidth={2.2} />
              ) : (
                <Brain className="h-5 w-5" strokeWidth={2.2} />
              )}
            </div>
          </div>

          <div
            className={`mt-4 flex min-h-[120px] items-center justify-center overflow-hidden ${landingRadius} border border-brand-dark bg-bg-primary p-3 sm:mt-5 sm:min-h-[140px] sm:p-4`}
          >
            <m.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="w-full max-w-[180px] sm:max-w-[200px]"
            >
              <Image
                src="/images/home/undraw-searching-focus.svg"
                alt="Ilustração de busca e revisão focada"
                width={300}
                height={240}
                unoptimized
                priority
                className="mx-auto h-auto w-full object-contain select-none"
              />
            </m.div>
          </div>
        </m.div>
      </div>
    </header>
  )
}
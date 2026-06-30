'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Compass, Plus } from 'lucide-react'
import { m } from 'framer-motion'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingRadius } from '@/lib/landingStyles'
import {
  studyDayStrip,
  studyHero,
  studyIconBox,
  studyPill,
  studyPrimaryBtn,
  studySoftBtn,
  studyTile,
} from '@/features/study/lib/studyUi'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'

interface StudyHeaderProps {
  activityCount: number
  pendingCount: number
  completedCount: number
}

export default function StudyHeader({
  activityCount,
  pendingCount,
  completedCount,
}: StudyHeaderProps) {
  const completionRate = activityCount > 0 ? Math.round((completedCount / activityCount) * 100) : 0

  return (
    <header className={`${studyHero} p-4 sm:p-8 lg:p-10`}>
      <div className="relative z-10 mb-5 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <Link href="/home" transitionTypes={navBackTransitionTypes} className={studySoftBtn}>
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Início
        </Link>
        <Link href="/explore" transitionTypes={navForwardTransitionTypes} className={studySoftBtn}>
          <Plus className="h-4 w-4 shrink-0" />
          Adicionar pack
        </Link>
      </div>

      <div className="relative z-10 grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-8">
        <div className="min-w-0">
          <StudyBreadcrumb
            items={[
              { label: 'Início', href: '/home' },
              { label: 'Minha rotina' },
            ]}
            className="mb-4"
          />

          <div className="flex flex-wrap items-center gap-2">
            <SectionBadge label="Plano de estudos" animate={false} />
            <span className={`${studyPill} bg-brand-accent`}>Rotina diária</span>
          </div>

          <h1 className="mt-5 max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl lg:text-5xl">
            Minha rotina
          </h1>

          <div className={`${studyDayStrip} mt-5 sm:mt-6`}>
            <div className="min-w-0">
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                Progresso de hoje
              </p>
              <p className="mt-1 font-heading text-lg font-bold text-brand-dark sm:text-xl">
                {completedCount} de {activityCount} concluída{activityCount === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:max-w-xs">
              <div className="h-2 flex-1 overflow-hidden rounded-full border border-brand-dark bg-bg-card">
                <div
                  className="h-full rounded-full bg-brand-dark transition-all duration-500"
                  style={{ width: `${Math.max(activityCount > 0 ? 8 : 0, completionRate)}%` }}
                />
              </div>
              <span className="shrink-0 font-heading text-sm font-bold tabular-nums text-brand-dark">{completionRate}%</span>
            </div>
          </div>

          <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:mt-5 sm:text-base">
            Escolha o que estudar hoje. Você pode adicionar packs do catálogo e remover apenas os que incluiu.
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link href="/explore" transitionTypes={navForwardTransitionTypes} className={`${studyPrimaryBtn} w-full sm:w-auto`}>
              <Compass className="h-4 w-4 shrink-0" />
              Explorar packs
            </Link>
            {pendingCount > 0 ? (
              <a href="#atividades" className={`${studySoftBtn} w-full sm:w-auto`}>
                <BookOpen className="h-4 w-4 shrink-0" />
                {pendingCount} pendente{pendingCount === 1 ? '' : 's'}
              </a>
            ) : null}
          </div>
        </div>

        <m.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.12, stiffness: 260, damping: 24 }}
          className={`${studyTile} p-4 sm:p-6`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className={studyPill}>Hoje</span>
              <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
                {activityCount} {activityCount === 1 ? 'atividade' : 'atividades'}
              </h2>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary sm:text-sm">
                {pendingCount > 0
                  ? `${pendingCount} ${pendingCount === 1 ? 'sessão aguardando' : 'sessões aguardando'} para você começar.`
                  : activityCount > 0
                    ? 'Todas as sessões de hoje foram concluídas.'
                    : 'Adicione packs do catálogo para montar sua rotina.'}
              </p>
            </div>
            <div className={`h-11 w-11 shrink-0 ${studyIconBox}`}>
              <BookOpen className="h-5 w-5" strokeWidth={2.2} />
            </div>
          </div>

          <div className={`mt-4 flex min-h-[120px] items-center justify-center overflow-hidden ${landingRadius} border border-brand-dark bg-bg-primary p-3 sm:mt-5 sm:min-h-[140px] sm:p-4`}>
            <m.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="w-full max-w-[180px] sm:max-w-[200px]"
            >
              <Image
                src="/images/home/undraw-study-routine.svg"
                alt="Ilustração de planejamento de rotina de estudos"
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
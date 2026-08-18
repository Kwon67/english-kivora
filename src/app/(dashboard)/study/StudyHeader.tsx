'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Compass } from 'lucide-react'
import { m } from 'framer-motion'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingRadius } from '@/lib/landingStyles'
import {
  studyHero,
  studyIconBox,
  studyPill,
  studyPrimaryBtn,
  studySoftBtn,
  studyTile,
} from '@/features/study/lib/studyUi'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

interface StudyHeaderProps {
  activityCount: number
  pendingCount: number
  completedCount: number
  nextPendingAssignmentId?: string | null
}

export default function StudyHeader({
  activityCount,
  pendingCount,
  completedCount,
  nextPendingAssignmentId = null,
}: StudyHeaderProps) {
  const completionRate = activityCount > 0 ? Math.round((completedCount / activityCount) * 100) : 0
  const primaryAction = pendingCount > 0 && nextPendingAssignmentId
    ? {
      href: `/play/${nextPendingAssignmentId}`,
      label: 'Continuar estudo',
      Icon: BookOpen,
    }
    : {
      href: '/explore',
      label: activityCount > 0 ? 'Adicionar pack' : 'Explorar packs',
      Icon: Compass,
    }
  const PrimaryActionIcon = primaryAction.Icon

  return (
    <header className={`${studyHero} p-4 sm:p-8 lg:p-10`}>
      {/* The old header said the same three things three times: a "Início" button above a
          breadcrumb that already links Início, two badges for one section, and an "Adicionar
          pack" button duplicating the hero CTA below it. Breadcrumb + one badge is enough. */}
      <div className="relative z-10 grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-8">
        <div className="min-w-0">
          <StudyBreadcrumb
            items={[
              { label: 'Início', href: '/home' },
              { label: 'Minha rotina' },
            ]}
            className="mb-4"
          />

          <SectionBadge label="Rotina diária" animate={false} />

          <h1 className="mt-4 max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl lg:text-5xl">
            Minha rotina
          </h1>

          <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Sua fila de estudo do dia. Os packs ficam aqui até você concluir cada um.
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link href={primaryAction.href} transitionTypes={navForwardTransitionTypes} className={`${studyPrimaryBtn} w-full sm:w-auto`}>
              <PrimaryActionIcon className="h-4 w-4 shrink-0" />
              {primaryAction.label}
            </Link>
            {pendingCount > 0 ? (
              <a href="#atividades" className={`${studySoftBtn} w-full sm:w-auto`}>
                <BookOpen className="h-4 w-4 shrink-0" />
                {pendingCount} pendente{pendingCount === 1 ? '' : 's'}
              </a>
            ) : activityCount > 0 ? (
              <Link href="/explore" transitionTypes={navForwardTransitionTypes} className={`${studySoftBtn} w-full sm:w-auto`}>
                <Compass className="h-4 w-4 shrink-0" />
                Explorar packs
              </Link>
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
                {completedCount} de {activityCount} concluída{activityCount === 1 ? '' : 's'}
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

          {activityCount > 0 ? (
            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full border border-brand-dark bg-bg-card">
                {/* Fills from empty on mount so the day's progress reads as something earned. */}
                <m.div
                  className="h-full rounded-full bg-brand-dark"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(8, completionRate)}%` }}
                  transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="shrink-0 font-heading text-sm font-bold tabular-nums text-brand-dark">{completionRate}%</span>
            </div>
          ) : null}

          <div className={`mt-4 flex min-h-[90px] items-center justify-center overflow-hidden ${landingRadius} border border-brand-dark bg-bg-primary p-3 sm:min-h-[110px] sm:p-4`}>
            <m.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="w-full max-w-[140px] sm:max-w-[160px]"
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

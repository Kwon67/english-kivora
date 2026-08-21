'use client'

import Link from 'next/link'
import { BookOpen, Compass } from 'lucide-react'
import { m } from 'motion/react'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
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
    <header className={`${studyHero} p-5 sm:p-8 lg:p-10`}>
      {/* The old header said the same three things three times: a "Início" button above a
          breadcrumb that already links Início, two badges for one section, and an "Adicionar
          pack" button duplicating the hero CTA below it. Breadcrumb + one badge is enough. */}
      <div className="relative z-10 grid min-w-0 gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-8">
        <div className="min-w-0">
          <StudyBreadcrumb
            items={[
              { label: 'Início', href: '/home' },
              { label: 'Minha rotina' },
            ]}
            className="mb-3"
          />

          {/* O selo dizia "Rotina diária" logo acima de um título "Minha rotina": a mesma
              palavra duas vezes, em dois pesos. Ficou o título. */}
          <h1 className="max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl">
            Minha rotina
          </h1>

          <p className="mt-2 max-w-xl font-body text-sm leading-relaxed text-brand-secondary">
            Sua fila do dia. Cada pack fica aqui até você concluir.
          </p>

          {/* Sem pendências o primário já era "Adicionar pack" apontando para /explore, e o
              secundário era "Explorar packs" apontando para /explore também: dois botões, um
              destino. O secundário agora só existe quando leva a outro lugar — a lista de
              atividades logo abaixo. */}
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link href={primaryAction.href} transitionTypes={navForwardTransitionTypes} className={`${studyPrimaryBtn} w-full sm:w-auto`}>
              <PrimaryActionIcon className="h-4 w-4 shrink-0" />
              {primaryAction.label}
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
          className={`${studyTile} p-5 sm:p-6`}
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

          {/* Sem a ilustração, o progresso É o elemento visual do card — por isso ganha respiro
              e a porcentagem vira o número grande, em vez de um rótulo ao lado da barra. */}
          {activityCount > 0 ? (
            <div className="mt-5 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full border border-brand-dark bg-bg-card">
                {/* Fills from empty on mount so the day's progress reads as something earned. */}
                <m.div
                  className="h-full rounded-full bg-brand-dark"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(8, completionRate)}%` }}
                  transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="shrink-0 font-heading text-xl font-bold tabular-nums leading-none text-brand-dark">
                {completionRate}%
              </span>
            </div>
          ) : null}
        </m.div>
      </div>
    </header>
  )
}

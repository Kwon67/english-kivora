'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { BookOpen, Clock, Compass, Loader2, Shield, Trash2 } from 'lucide-react'
import { removeSelfAssignmentAction, selfAssignPackAction } from '@/app/member-assign-actions'
import { isSelfRoutineAssignment } from '@/features/study/lib/routineAssignments'
import {
  isAssignmentCompleted,
  parseAssignmentStatus,
} from '@/features/game/lib/assignmentStatus'
import { getGameModeOption } from '@/features/game/lib/gameModes'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { notify } from '@/lib/toast'

export type StudyRoutineAssignment = {
  id: string
  pack_id: string
  game_mode: string
  status: string
  assigned_by: string
  assigned_date: string
  created_at?: string | null
  reward_badge_id?: string | null
  packs: {
    name: string
    description: string | null
  } | null
}

type MyStudyRoutineProps = {
  assignments: StudyRoutineAssignment[]
}

const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] transition-all duration-300'
const cardSheen =
  'home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]'

export default function MyStudyRoutine({ assignments }: MyStudyRoutineProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [restudyingId, setRestudyingId] = useState<string | null>(null)

  function handleStudyAgain(assignment: StudyRoutineAssignment) {
    setRestudyingId(assignment.id)
    startTransition(async () => {
      const result = await selfAssignPackAction({
        packId: assignment.pack_id,
        gameMode: assignment.game_mode,
      })
      setRestudyingId(null)

      if (!result.success) {
        notify.error(result.error)
        return
      }

      notify.success('Nova sessão criada para hoje')
      router.push(`/play/${result.assignmentId}`)
    })
  }

  function handleRemove(assignmentId: string) {
    setRemovingId(assignmentId)
    startTransition(async () => {
      const result = await removeSelfAssignmentAction(assignmentId)
      setRemovingId(null)

      if (!result.success) {
        notify.error(result.error)
        return
      }

      notify.success('Removido da sua rotina')
      router.refresh()
    })
  }

  if (assignments.length === 0) {
    return (
      <div className={`${glassTile} relative overflow-hidden p-6 sm:p-8`}>
        <div className={cardSheen} />
        <div className="relative z-10">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-text-subtle dark:text-text-muted">
          Comece por aqui
        </p>
        <h2 className="mt-3 font-montserrat text-2xl font-bold text-text dark:text-text">
          Sua rotina ainda está vazia
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted dark:text-text-muted">
          A rotina mostra os packs que você adicionou do catálogo. Revisões SRS em Dificuldades
          mantêm seu vocabulário, mas não entram aqui automaticamente.
        </p>
        <ol className="mt-6 space-y-3 text-sm text-text-muted dark:text-text-muted">
          <li>1. Explore o catálogo de packs</li>
          <li>2. Escolha o modo de jogo ao adicionar</li>
          <li>3. Comece pelo Início ou direto daqui</li>
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/explore" transitionTypes={navForwardTransitionTypes} className="btn-primary">
            <Compass className="h-4 w-4" />
            Explorar packs
          </Link>
          <Link href="/home" transitionTypes={navForwardTransitionTypes} className="btn-ghost">
            Voltar para a Home
          </Link>
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {assignments.map((assignment) => {
        const mode = getGameModeOption(assignment.game_mode)
        const statusMeta = parseAssignmentStatus(assignment.status)
        const completed = isAssignmentCompleted(assignment.status)
        const isSelf = isSelfRoutineAssignment(assignment)
        const canRemove = isSelf && !completed
        const canStudyAgain = isSelf && completed
        const isRemoving = isPending && removingId === assignment.id
        const isRestudying = isPending && restudyingId === assignment.id

        return (
          <article
            key={assignment.id}
            className={`${glassTile} group/card relative flex flex-col gap-4 p-5 sm:p-6 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:hover:border-primary/30 dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.5)]`}
          >
            <div className={cardSheen} />
            <div className="relative z-10 flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex items-center rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-primary dark:border-border-accent/18 dark:bg-primary/12">
                  {mode.shortLabel}
                </span>
                <h3 className="mt-3 font-montserrat text-lg font-bold text-text dark:text-text">
                  {assignment.packs?.name || 'Pack'}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-text-muted dark:text-text-muted">
                  {assignment.packs?.description || 'Sessão preparada para manter sua consistência no inglês.'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-primary dark:bg-primary/8 group-hover/card:scale-110 transition-transform duration-300">
                <BookOpen className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-text-subtle dark:text-text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {statusMeta.timeLimitMinutes ? `${statusMeta.timeLimitMinutes} min` : 'Sem limite'}
              </span>
              {assignment.assigned_by === 'admin' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border-muted/18 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.08em] text-text-subtle">
                  <Shield className="h-3.5 w-3.5" />
                  Atribuído pelo admin
                </span>
              ) : (
                <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.08em] text-primary">
                  Adicionado por você
                </span>
              )}
              {completed ? (
                <span className="rounded-full bg-primary-container px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.08em] text-primary">
                  Concluído
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {!completed ? (
                <Link
                  href={`/play/${assignment.id}`}
                  transitionTypes={navForwardTransitionTypes}
                  className="btn-primary min-h-10"
                >
                  Começar
                </Link>
              ) : null}
              {canStudyAgain ? (
                <button
                  type="button"
                  onClick={() => handleStudyAgain(assignment)}
                  disabled={isRestudying}
                  className="btn-primary min-h-10"
                >
                  {isRestudying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Estudar de novo
                </button>
              ) : null}
              {canRemove ? (
                <button
                  type="button"
                  onClick={() => handleRemove(assignment.id)}
                  disabled={isRemoving}
                  className="btn-ghost min-h-10 text-text-muted hover:text-[var(--color-error)]"
                >
                  {isRemoving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Remover da rotina
                </button>
              ) : null}
            </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
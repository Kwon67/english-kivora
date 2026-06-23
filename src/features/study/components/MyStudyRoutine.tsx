'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { BookOpen, Clock, Loader2, Shield, Trash2 } from 'lucide-react'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import { removeSelfAssignmentAction, selfAssignPackAction } from '@/app/member-assign-actions'
import { isSelfRoutineAssignment } from '@/features/study/lib/routineAssignments'
import {
  isAssignmentCompleted,
  parseAssignmentStatus,
} from '@/features/game/lib/assignmentStatus'
import { getGameModeOption } from '@/features/game/lib/gameModes'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { cardSheen, glassTile } from '@/lib/dashboardUi'
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

export default function MyStudyRoutine({ assignments }: MyStudyRoutineProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [restudyingId, setRestudyingId] = useState<string | null>(null)
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)

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
    setPendingRemoveId(assignmentId)
  }

  function confirmRemove() {
    if (!pendingRemoveId) return

    const assignmentId = pendingRemoveId
    setPendingRemoveId(null)
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
      <OnboardingChecklist
        variant="tile"
        secondaryHref="/home"
        secondaryLabel="Voltar para o Início"
      />
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
                  disabled={isRemoving || isPending}
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
      {pendingRemoveId ? (
        <ConfirmDialog
          title="Remover da rotina?"
          description="Este pack sairá da sua rotina de hoje. Você pode adicioná-lo novamente pelo catálogo quando quiser."
          confirmLabel="Remover"
          cancelLabel="Manter na rotina"
          variant="warning"
          onConfirm={confirmRemove}
          onCancel={() => setPendingRemoveId(null)}
        />
      ) : null}
    </div>
  )
}
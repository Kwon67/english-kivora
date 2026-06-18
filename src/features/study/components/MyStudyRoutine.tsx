'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { BookOpen, Clock, Compass, Loader2, Shield, Trash2 } from 'lucide-react'
import { removeSelfAssignmentAction } from '@/app/member-assign-actions'
import {
  isAssignmentCompleted,
  parseAssignmentStatus,
} from '@/features/game/lib/assignmentStatus'
import { getGameModeOption } from '@/features/game/lib/gameModes'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { notify } from '@/lib/toast'

export type StudyRoutineAssignment = {
  id: string
  game_mode: string
  status: string
  assigned_by: string
  assigned_date: string
  packs: {
    name: string
    description: string | null
  } | null
}

type MyStudyRoutineProps = {
  assignments: StudyRoutineAssignment[]
}

const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]'

export default function MyStudyRoutine({ assignments }: MyStudyRoutineProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)

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
      <div className={`${glassTile} p-6 sm:p-8`}>
        <p className="text-sm font-black uppercase tracking-[0.14em] text-text-subtle">
          Comece por aqui
        </p>
        <h2 className="mt-3 font-montserrat text-2xl font-bold text-text">
          Sua rotina ainda está vazia
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
          Escolha packs do catálogo, defina o modo de estudo e acompanhe tudo nesta página.
        </p>
        <ol className="mt-6 space-y-3 text-sm text-text-muted">
          <li>1. Explore o catálogo de packs</li>
          <li>2. Escolha o modo de jogo ao adicionar</li>
          <li>3. Comece pela Home ou direto daqui</li>
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
    )
  }

  return (
    <div className="grid gap-4">
      {assignments.map((assignment) => {
        const mode = getGameModeOption(assignment.game_mode)
        const statusMeta = parseAssignmentStatus(assignment.status)
        const completed = isAssignmentCompleted(assignment.status)
        const canRemove = assignment.assigned_by === 'self' && !completed
        const isRemoving = isPending && removingId === assignment.id

        return (
          <article key={assignment.id} className={`${glassTile} flex flex-col gap-4 p-5 sm:p-6`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex items-center rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-primary dark:border-border-accent/18 dark:bg-primary/12">
                  {mode.shortLabel}
                </span>
                <h3 className="mt-3 font-montserrat text-lg font-bold text-text">
                  {assignment.packs?.name || 'Pack'}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                  {assignment.packs?.description || 'Sessão preparada para manter sua consistência no inglês.'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-primary dark:bg-primary/8">
                <BookOpen className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-text-subtle">
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
          </article>
        )
      })}
    </div>
  )
}
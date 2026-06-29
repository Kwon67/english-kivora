'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { BookOpen, Clock, Loader2, Search, Shield, Trash2, X } from 'lucide-react'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import { removeSelfAssignmentAction, selfAssignPackAction } from '@/app/member-assign-actions'
import { isSelfRoutineAssignment } from '@/features/study/lib/routineAssignments'
import {
  filterRoutineAssignmentsBySmartQuery,
  type RoutineSearchCard,
} from '@/features/study/lib/routineSearch'
import {
  isAssignmentCompleted,
  parseAssignmentStatus,
} from '@/features/game/lib/assignmentStatus'
import { getGameModeOption } from '@/features/game/lib/gameModes'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
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
    category?: string | null
    level?: string | null
  } | null
  searchCards?: RoutineSearchCard[]
}

type MyStudyRoutineProps = {
  assignments: StudyRoutineAssignment[]
}

const routinePanel =
  'render-contained relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[6px_6px_0_var(--color-brand-dark)]'
const routinePill =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark'
const routinePrimary =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-brand-dark px-4 py-2 font-body text-sm font-semibold text-white shadow-[3px_3px_0_var(--color-brand-accent)] transition hover:translate-x-[1px] hover:translate-y-[1px]'
const routineSoft =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-bg-card px-4 py-2 font-body text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white'

export default function MyStudyRoutine({ assignments }: MyStudyRoutineProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [restudyingId, setRestudyingId] = useState<string | null>(null)
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const filteredAssignments = useMemo(
    () => filterRoutineAssignmentsBySmartQuery(assignments, searchQuery),
    [assignments, searchQuery]
  )
  const isSearching = searchQuery.trim().length > 0

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
      <div className={`${routinePanel} p-4 sm:p-5`}>
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar pack ou card"
              aria-label="Buscar na rotina"
              className="min-h-12 w-full rounded-xl border-2 border-brand-dark bg-bg-primary px-10 py-3 font-body text-sm font-semibold text-brand-dark outline-none transition-colors placeholder:text-brand-secondary focus:bg-white"
            />
            {isSearching ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-brand-secondary transition-colors hover:bg-brand-dark hover:text-white"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <span className="inline-flex min-h-9 items-center justify-center rounded-full border border-brand-dark bg-brand-accent px-3 py-1 font-heading text-[0.66rem] font-bold uppercase tracking-widest text-brand-dark">
            {isSearching ? `${filteredAssignments.length} de ${assignments.length}` : `${assignments.length} na rotina`}
          </span>
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className={`${routinePanel} p-6 text-center`}>
          <div className="relative z-10 mx-auto max-w-md">
            <p className="font-heading text-lg font-bold text-brand-dark">Nenhum item encontrado</p>
            <p className="mt-2 font-body text-sm text-brand-secondary">
              Tente uma palavra do pack, uma frase do card ou uma tradução.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className={`${routineSoft} mt-4`}
            >
              Limpar busca
            </button>
          </div>
        </div>
      ) : null}

      {filteredAssignments.map((assignment) => {
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
            className={`${routinePanel} scroll-reveal group/card flex flex-col gap-4 p-5 transition-transform hover:-translate-y-1 sm:p-6`}
          >
            <div className="relative z-10 flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <span className={routinePill}>
                  {mode.shortLabel}
                </span>
                <h3 className="mt-3 font-heading text-lg font-bold text-brand-dark">
                  {assignment.packs?.name || 'Pack'}
                </h3>
                <p className="mt-1 line-clamp-2 font-body text-sm text-brand-secondary">
                  {assignment.packs?.description || 'Sessão preparada para manter sua consistência no inglês.'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)] transition-transform duration-300 group-hover/card:scale-110">
                <BookOpen className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-body text-xs font-semibold text-brand-secondary">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {statusMeta.timeLimitMinutes ? `${statusMeta.timeLimitMinutes} min` : 'Sem limite'}
              </span>
              {assignment.assigned_by === 'admin' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border px-2.5 py-1 font-heading text-[0.62rem] font-bold uppercase tracking-widest text-brand-secondary">
                  <Shield className="h-3.5 w-3.5" />
                  Atribuído pelo admin
                </span>
              ) : (
                <span className="rounded-full border border-brand-dark bg-bg-primary px-2.5 py-1 font-heading text-[0.62rem] font-bold uppercase tracking-widest text-brand-dark">
                  Adicionado por você
                </span>
              )}
              {completed ? (
                <span className="rounded-full border border-brand-dark bg-brand-accent px-2.5 py-1 font-heading text-[0.62rem] font-bold uppercase tracking-widest text-brand-dark">
                  Concluído
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {!completed ? (
                <Link
                  href={`/play/${assignment.id}`}
                  transitionTypes={navForwardTransitionTypes}
                  className={routinePrimary}
                >
                  Começar
                </Link>
              ) : null}
              {canStudyAgain ? (
                <button
                  type="button"
                  onClick={() => handleStudyAgain(assignment)}
                  disabled={isRestudying}
                  className={routinePrimary}
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
                  className={routineSoft}
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

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { m } from 'motion/react'
import { ArrowLeft, BookOpen, CheckCircle2, ChevronDown, Clock, Compass, Loader2, RotateCcw, Search, Shield, Trash2, X } from 'lucide-react'
import { removeSelfAssignmentAction, selfAssignPackAction } from '@/app/member-assign-actions'
import { getDisplayPackDescription } from '@/features/study/lib/packDescription'
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
import { landingRadius } from '@/lib/landingStyles'
import {
  studyAssignmentCard,
  studyCard,
  studyCompletedRow,
  studyIconBox,
  studyPill,
  studyPrimaryBtn,
  studySearchInput,
  studySoftBtn,
} from '@/features/study/lib/studyUi'

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
  const pendingAssignments = filteredAssignments.filter((assignment) => !isAssignmentCompleted(assignment.status))
  const completedAssignments = filteredAssignments.filter((assignment) => isAssignmentCompleted(assignment.status))
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
      <article className={`${studyCard} p-6 sm:p-8`}>
        <div className="mx-auto max-w-2xl text-center">
          <div className={`mx-auto h-12 w-12 ${studyIconBox}`}>
            <BookOpen className="h-6 w-6" strokeWidth={2.3} />
          </div>
          <h3 className="mt-5 font-heading text-2xl font-bold text-brand-dark">
            Sua rotina está vazia
          </h3>
          <p className="mt-3 font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Adicione packs do catálogo para montar uma rotina diária com modos de estudo, revisão e prática guiada.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/explore" transitionTypes={navForwardTransitionTypes} className={`${studyPrimaryBtn} w-full sm:w-auto`}>
              <Compass className="h-4 w-4" />
              Explorar packs
            </Link>
            <Link href="/home" transitionTypes={navForwardTransitionTypes} className={`${studySoftBtn} w-full sm:w-auto`}>
              <ArrowLeft className="h-4 w-4" />
              Voltar ao início
            </Link>
          </div>
        </div>
      </article>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4">
      <div className={`${studyCard} p-4 sm:p-5`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar pack ou card"
              aria-label="Buscar na rotina"
              className={studySearchInput}
            />
            {isSearching ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center ${landingRadius} text-brand-secondary transition-colors hover:bg-brand-dark hover:text-white`}
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <span className={`${studyPill} shrink-0 self-start bg-brand-accent sm:self-auto`}>
            {isSearching ? `${filteredAssignments.length} de ${assignments.length}` : `${assignments.length} na rotina`}
          </span>
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className={`${studyCard} p-6 text-center`}>
          <div className="mx-auto max-w-md">
            <p className="font-heading text-lg font-bold text-brand-dark">Nenhum item encontrado</p>
            <p className="mt-2 font-body text-sm text-brand-secondary">
              Não encontrei resultado para “{searchQuery.trim()}”. Tente nome do pack, frase em inglês, tradução, nível ou modo de estudo.
            </p>
            <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={() => setSearchQuery('')} className={studySoftBtn}>
                Limpar busca
              </button>
              <Link href="/explore" transitionTypes={navForwardTransitionTypes} className={studySoftBtn}>
                <Compass className="h-4 w-4" />
                Explorar packs
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {pendingAssignments.length > 0 ? (
        <section className="grid gap-3 sm:gap-4" aria-labelledby="study-pending-title">
          <div className="flex items-center justify-between gap-3 px-1">
            <h3 id="study-pending-title" className="font-heading text-sm font-bold uppercase tracking-widest text-brand-secondary">
              Pendentes
            </h3>
            <span className={studyPill}>
              {pendingAssignments.length} para estudar
            </span>
          </div>
          {pendingAssignments.map((assignment, index) => {
        const mode = getGameModeOption(assignment.game_mode)
        const statusMeta = parseAssignmentStatus(assignment.status)
        const isSelf = isSelfRoutineAssignment(assignment)
        const canRemove = isSelf
        const isRemoving = isPending && removingId === assignment.id

        return (
          <m.article
            key={assignment.id}
            role="link"
            tabIndex={0}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.06, 0.4), duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            whileTap={{ scale: 0.99 }}
            onClick={() => router.push(`/play/${assignment.id}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                router.push(`/play/${assignment.id}`)
              }
            }}
            className={`${studyAssignmentCard} group/card cursor-pointer hover:shadow-[6px_6px_0_var(--color-brand-dark)] focus-visible:ring-2 focus-visible:ring-brand-dark/30`}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className={studyPill}>{mode.shortLabel}</span>
                  <h3 className="mt-3 font-heading text-lg font-bold text-brand-dark">
                    {assignment.packs?.name || 'Pack'}
                  </h3>
                  <p className="mt-1 line-clamp-2 font-body text-sm text-brand-secondary">
                    {getDisplayPackDescription(
                      assignment.packs?.description,
                      'Sessão preparada para manter sua consistência no inglês.'
                    )}
                  </p>
                </div>
                <div className={`h-10 w-10 shrink-0 ${studyIconBox} transition-transform duration-300 group-hover/card:scale-105`}>
                  <BookOpen className="h-5 w-5" strokeWidth={2.2} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-body text-xs font-semibold text-brand-secondary">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {statusMeta.timeLimitMinutes ? `${statusMeta.timeLimitMinutes} min` : 'Sem limite'}
                </span>
                {assignment.assigned_by === 'admin' ? (
                  <span className={`${studyPill} gap-1.5 text-brand-secondary`}>
                    <Shield className="h-3.5 w-3.5 shrink-0" />
                    Atribuído pelo admin
                  </span>
                ) : (
                  <span className={studyPill}>Adicionado por você</span>
                )}
              </div>

              {/* "Começar" owns the card; removing is a rare, destructive escape hatch and gets
                  an icon button rather than a second full-width control competing with it. */}
              <div className="flex items-center gap-2">
                <span className={`${studyPrimaryBtn} flex-1 px-5 py-2.5 text-sm sm:flex-none`}>
                  Começar
                </span>
                {canRemove ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleRemove(assignment.id)
                    }}
                    disabled={isRemoving || isPending}
                    aria-label="Remover da rotina"
                    title="Remover da rotina"
                    className={`${studySoftBtn} h-11 w-11 shrink-0 p-0 disabled:opacity-60`}
                  >
                    {isRemoving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          </m.article>
        )
          })}
        </section>
      ) : filteredAssignments.length > 0 ? (
        /* The header tile already reports "X de X concluídas" and 100%, so this only needs to
           celebrate briefly and offer the way forward — not restate the count a third time. */
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={`${studyCard} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6`}
        >
          <div className="flex min-w-0 items-center gap-4">
            <m.div
              initial={{ scale: 0.6, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.15 }}
              className={`h-11 w-11 shrink-0 ${studyIconBox}`}
            >
              <CheckCircle2 className="h-5 w-5" strokeWidth={2.4} />
            </m.div>
            <p className="min-w-0 font-heading text-lg font-bold text-brand-dark">
              Rotina de hoje concluída
            </p>
          </div>
          <Link
            href="/explore"
            transitionTypes={navForwardTransitionTypes}
            className={`${studySoftBtn} w-full shrink-0 sm:w-auto`}
          >
            <Compass className="h-4 w-4" />
            Explorar packs
          </Link>
        </m.div>
      ) : null}

      {/* Collapsed by default. Expanded, 24 finished sessions were ~7.500px of full-weight cards
          — each with its own lime button — burying the handful of things still to do. A search
          hit re-opens it automatically, otherwise finished work stays one row away. */}
      {completedAssignments.length > 0 ? (
        <details key={isSearching ? 'search' : 'idle'} open={isSearching} className={`${studyCard} group overflow-hidden`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 marker:content-none">
            <span className="flex min-w-0 items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-dark" strokeWidth={2.4} />
              <span className="font-heading text-sm font-bold uppercase tracking-widest text-brand-secondary">
                Concluídas
              </span>
              <span className={studyPill}>{completedAssignments.length}</span>
            </span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-brand-secondary transition-transform duration-300 group-open:rotate-180"
              strokeWidth={2.4}
            />
          </summary>

          {/* grid-cols-1 (minmax(0,1fr)), not bare `grid`: an implicit auto track sizes to
              max-content, and the nowrap pack name pushed each row past the panel — the restudy
              button ended up clipped off-screen by the details' overflow-hidden. */}
          <div className="grid grid-cols-1 gap-2 border-t border-brand-dark/15 p-3 sm:p-4">
            {completedAssignments.map((assignment) => {
              const mode = getGameModeOption(assignment.game_mode)
              const canStudyAgain = isSelfRoutineAssignment(assignment)
              const isRestudying = isPending && restudyingId === assignment.id

              return (
                <article key={assignment.id} className={studyCompletedRow}>
                  <span className={`${studyPill} shrink-0`}>{mode.shortLabel}</span>
                  <h3 className="min-w-0 flex-1 truncate font-heading text-sm font-bold text-brand-dark">
                    {assignment.packs?.name || 'Pack'}
                  </h3>
                  {canStudyAgain ? (
                    <button
                      type="button"
                      onClick={() => handleStudyAgain(assignment)}
                      disabled={isRestudying}
                      className={`${studySoftBtn} shrink-0 px-3 py-1.5 text-xs disabled:opacity-60`}
                    >
                      {isRestudying ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      <span className="hidden sm:inline">Estudar de novo</span>
                    </button>
                  ) : null}
                </article>
              )
            })}
          </div>
        </details>
      ) : null}
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

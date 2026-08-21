'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { clearFocusAreaAction } from '@/app/actions'
import { parseAssignmentStatus } from '@/features/game/lib/assignmentStatus'
import SessionErrorsViewer, { type SessionErrorLog } from '@/features/game/components/SessionErrorsViewer'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatAppDate } from '@/lib/timezone'
import { notify } from '@/lib/toast'
import { historyCard, historyPill } from '@/features/history/lib/historyUi'
import { landingRadiusLg } from '@/lib/landingStyles'

export type HistoryFocusSession = {
  id: string
  completed_at: string
  correct_answers: number
  wrong_answers: number
  max_streak: number
  assignments: {
    status: string
    game_mode: string
    packs: { name: string } | null
    badges: { name: string; icon_name: string } | null
  } | null
  session_errors: SessionErrorLog[]
}

type HistoryFocusAreaSectionProps = {
  sessions: HistoryFocusSession[]
  filterDate?: string
}

export default function HistoryFocusAreaSection({ sessions, filterDate }: HistoryFocusAreaSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const [localSessions, setLocalSessions] = useState(sessions)

  useEffect(() => {
    setLocalSessions(sessions)
  }, [sessions])

  const totalErrors = useMemo(
    () => localSessions.reduce((sum, session) => sum + (session.session_errors?.length ?? 0), 0),
    [localSessions]
  )

  function handleClearFocusArea() {
    setShowConfirm(false)

    startTransition(async () => {
      const result = await clearFocusAreaAction()

      if (!result.success) {
        notify.error(result.error || 'Não foi possível limpar a área de foco.')
        return
      }

      setLocalSessions((current) =>
        current.map((session) => ({
          ...session,
          session_errors: [],
        }))
      )
      notify.success('Área de foco limpa com sucesso.')
      router.refresh()
    })
  }

  return (
    <>
      <section className={`${historyCard} relative overflow-hidden`}>
        <div className="border-b border-brand-dark px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-heading text-xl font-bold text-brand-dark sm:text-2xl">Sessões recentes</h2>
              <p className="mt-2 font-body text-sm text-brand-secondary">
                Leitura rápida das suas sessões recentes.
                {totalErrors > 0 && (
                  <span className="mt-1 block text-[var(--color-error)]">
                    {totalErrors} {totalErrors === 1 ? 'erro registrado' : 'erros registrados'}.
                  </span>
                )}
              </p>
            </div>
            {totalErrors > 0 && (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={isPending}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-control border border-red-500/30 bg-red-500/10 px-3 py-2 font-heading text-xs font-bold text-red-700 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Limpar área de foco
              </button>
            )}
          </div>
        </div>

        <div className="relative px-4 py-2 sm:px-6 sm:py-3">
          {localSessions.length > 0 ? (
            <ol className="history-timeline space-y-0">
              {localSessions.slice(0, 10).map((session, index) => {
                const total = session.correct_answers + session.wrong_answers
                const pct = total > 0 ? Math.round((session.correct_answers / total) * 100) : 0
                const statusMeta = parseAssignmentStatus(session.assignments?.status)

                return (
                  <li
                    key={session.id}
                    className="history-timeline-item relative py-4 pl-8 sm:pl-10 sm:py-5"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <span
                      className={`absolute left-0 top-6 z-10 h-3 w-3 rounded-full border border-brand-dark sm:top-7 ${
                        pct >= 80 ? 'bg-brand-accent' : pct >= 50 ? 'bg-brand-accent-soft' : 'bg-bg-primary'
                      }`}
                      aria-hidden
                    />
                    <div
                      className={`${landingRadiusLg} border border-brand-dark/20 bg-bg-primary p-4 transition-transform hover:-translate-y-0.5 sm:p-5`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-body text-sm font-semibold text-brand-dark sm:text-base">
                            {session.assignments?.packs?.name || 'Sessão'}
                            {session.assignments?.badges && (
                              <span title={session.assignments.badges.name} className="text-lg">
                                🏅
                              </span>
                            )}
                          </p>
                          <p className="mt-1 font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary sm:text-xs">
                            {formatAppDate(session.completed_at, {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}{' '}
                            •{' '}
                            {statusMeta.baseStatus === 'incomplete'
                              ? 'Abandonada'
                              : statusMeta.completedWithinTime === false
                                ? 'Fora do tempo'
                                : 'Concluída'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`${historyPill} bg-brand-accent`}>
                            {session.correct_answers} certos
                          </span>
                          <span className={`${historyPill} bg-[rgba(186,26,26,0.08)] text-[var(--color-error)]`}>
                            {session.wrong_answers} erros
                          </span>
                          <span className={`${historyPill} tabular-nums`}>{pct}%</span>
                        </div>
                      </div>

                      {session.session_errors && session.session_errors.length > 0 && (
                        <div className="mt-3 border-t border-brand-dark/15 pt-3">
                          <SessionErrorsViewer errors={session.session_errors} defaultOpen={false} />
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          ) : (
            <EmptyState
              imageSrc="/images/home/undraw-growth-analytics.svg"
              imageAlt="Ilustração de histórico ainda vazio"
              title={filterDate ? 'Nenhuma sessão neste dia.' : 'Histórico vazio.'}
              description={
                filterDate
                  ? 'Nenhuma sessão registrada neste dia.'
                  : 'Jogue uma lição para começar a formar seu histórico.'
              }
              variant="compact"
              className="rounded-none bg-transparent px-2 py-12"
              imageClassName="max-w-36"
            />
          )}
        </div>
      </section>

      {showConfirm && (
        <ConfirmDialog
          title="Limpar área de foco?"
          description="Todos os erros detalhados das suas sessões serão removidos. As estatísticas gerais do histórico permanecem, mas a lista de falhas deixa de aparecer aqui e em Palavras Problemáticas."
          confirmLabel="Limpar"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={handleClearFocusArea}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}
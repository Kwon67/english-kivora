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

const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] transition-all duration-300'
const cardSheen =
  'home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]'

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
      <section className={`${glassTile} relative overflow-hidden`}>
        <div className={cardSheen} />
        <div className="relative z-10 border-b border-border-muted/20 dark:border-border-accent/15 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold text-text dark:text-text">Áreas de Foco</h2>
              <p className="mt-2 text-sm text-text-muted dark:text-text-muted">
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
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Limpar área de foco
              </button>
            )}
          </div>
        </div>

        <div className="relative z-10 divide-y divide-border-muted/20 dark:divide-border-accent/15">
          {localSessions.length > 0 ? (
            localSessions.slice(0, 10).map((session) => {
              const total = session.correct_answers + session.wrong_answers
              const pct = total > 0 ? Math.round((session.correct_answers / total) * 100) : 0
              const statusMeta = parseAssignmentStatus(session.assignments?.status)

              return (
                <div key={session.id} className="scroll-fade px-4 py-5 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-bold text-text dark:text-text">
                        {session.assignments?.packs?.name || 'Sessão'}
                        {session.assignments?.badges && (
                          <span title={session.assignments.badges.name} className="text-lg">
                            🏅
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-text-subtle dark:text-text-muted">
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
                      <span className="stitch-pill bg-[rgba(70,98,89,0.1)] text-primary">
                        {session.correct_answers} certos
                      </span>
                      <span className="stitch-pill bg-[rgba(186,26,26,0.08)] text-[var(--color-error)]">
                        {session.wrong_answers} erros
                      </span>
                      <span className="stitch-pill bg-[var(--color-surface-container-low)] text-text-muted">
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {session.session_errors && session.session_errors.length > 0 && (
                    <div className="mt-4">
                      <SessionErrorsViewer errors={session.session_errors} />
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <EmptyState
              imageSrc="/images/home/undraw-studying.svg"
              imageAlt="Ilustração unDraw de histórico ainda vazio"
              title={filterDate ? 'Nenhuma sessão neste dia.' : 'Histórico vazio.'}
              description={
                filterDate
                  ? 'Nenhuma sessão registrada neste dia.'
                  : 'Jogue uma lição para começar a formar seu histórico.'
              }
              variant="compact"
              className="rounded-none bg-transparent px-6 py-12"
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
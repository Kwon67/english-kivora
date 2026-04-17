'use client'

import { useState } from 'react'
import { Keyboard } from 'lucide-react'
import { formatAppDate } from '@/lib/timezone'
import { isAssignmentCompleted, isAssignmentIncomplete } from '@/lib/assignmentStatus'
import DeleteAssignmentButton from './DeleteAssignmentButton'

const assignmentModeLabel: Record<string, string> = {
  multiple_choice: 'Múltipla escolha',
  flashcard: 'Flashcard',
  typing: 'Digitação',
  matching: 'Combinação',
}

export type AssignmentItem = {
  id: string
  game_mode: string
  status: string
  assigned_date: string
  packs?: { name?: string | null; description?: string | null } | null
  profiles?: { username?: string | null } | null
}

const INITIAL_VISIBLE = 5

export default function AssignmentsList({ assignments }: { assignments: AssignmentItem[] }) {
  const [showAll, setShowAll] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const filtered = assignments.filter((a) => {
    if (filter === 'pending') return !isAssignmentCompleted(a.status)
    if (filter === 'completed') return isAssignmentCompleted(a.status)
    return true
  })

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE)
  const hasMore = filtered.length > INITIAL_VISIBLE

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-6 py-3">
        {(['all', 'pending', 'completed'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => { setFilter(f); setShowAll(false) }}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              filter === f
                ? 'bg-[var(--color-primary)] text-white'
                : 'border border-[var(--color-border)] bg-white/72 text-[var(--color-text-muted)] hover:bg-white'
            }`}
          >
            {f === 'all' ? `Todas (${assignments.length})` : f === 'pending' ? 'Pendentes' : 'Concluídas'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="divide-y divide-[var(--color-border)]">
        {visible.length > 0 ? (
          visible.map((assignment) => {
            const isCompleted = isAssignmentCompleted(assignment.status)
            const isIncomplete = isAssignmentIncomplete(assignment.status)
            const statusClass = isCompleted
              ? 'border border-[var(--color-primary-container)] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'
              : isIncomplete
                ? 'border border-amber-200 bg-amber-50 text-amber-700'
                : 'border border-[var(--color-secondary-container)] bg-[var(--color-secondary-container)] text-[var(--color-secondary)]'
            const statusLabel = isCompleted ? 'Concluída' : isIncomplete ? 'Incompleta' : 'Pendente'
            const modeLabel = assignmentModeLabel[assignment.game_mode] || assignment.game_mode

            return (
              <article
                key={assignment.id}
                className="flex flex-col gap-3 px-5 py-3.5 transition-colors hover:bg-white/72 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white/72 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-text-muted)]">
                      <Keyboard className="h-3 w-3" strokeWidth={2} />
                      {modeLabel}
                    </span>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}>
                      {statusLabel}
                    </span>
                    <span className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-text-muted)]">
                      {formatAppDate(`${assignment.assigned_date}T12:00:00Z`, {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="font-semibold text-[var(--color-text)]">
                    {assignment.packs?.name || 'Pack sem nome'}
                    <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">
                      — {assignment.profiles?.username || '—'}
                    </span>
                  </p>
                </div>

                <DeleteAssignmentButton
                  assignmentId={assignment.id}
                  username={assignment.profiles?.username || ''}
                  packName={assignment.packs?.name || ''}
                />
              </article>
            )
          })
        ) : (
          <p className="px-6 py-10 text-center text-[var(--color-text-muted)]">
            Nenhuma atribuição encontrada.
          </p>
        )}
      </div>

      {/* Show more / less */}
      {hasMore && (
        <div className="border-t border-[var(--color-border)] px-6 py-3">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="w-full rounded-[18px] border border-[var(--color-border)] bg-white/72 px-4 py-2.5 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-white hover:text-[var(--color-text)]"
          >
            {showAll
              ? 'Mostrar menos'
              : `Ver todas as ${filtered.length} atribuições`}
          </button>
        </div>
      )}
    </div>
  )
}

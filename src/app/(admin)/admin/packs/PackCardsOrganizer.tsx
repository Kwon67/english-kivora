'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Folder,
  FolderOpen,
  Mic,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import AudioButton from '@/components/ui/AudioButton'
import { formatAcceptedTranslations } from '@/features/cards/lib/cardTranslations'
import type { Card } from '@/types/database.types'

const CARDS_PER_FOLDER = 20

type CardEditForm = {
  en: string
  pt: string
  acceptedTranslations: string
}

type PackCardFolder = {
  id: string
  label: string
  rangeLabel: string
  startIndex: number
  cards: Card[]
}

type PackCardsOrganizerProps = {
  cards: Card[]
  editingCardId: string | null
  editForm: CardEditForm
  onEditFormChange: (form: CardEditForm) => void
  onStartEdit: (card: Card) => void
  onCancelEdit: () => void
  onSaveEdit: (cardId: string) => void
  onRegenerateTts: (cardId: string, phrase: string) => void
  onDelete: (card: Card) => void
}

function sortCards(cards: Card[]) {
  return [...cards].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
}

function buildFolders(cards: Card[]): PackCardFolder[] {
  const sorted = sortCards(cards)
  const folders: PackCardFolder[] = []

  for (let index = 0; index < sorted.length; index += CARDS_PER_FOLDER) {
    const chunk = sorted.slice(index, index + CARDS_PER_FOLDER)
    const start = index + 1
    const end = index + chunk.length

    folders.push({
      id: `folder-${start}`,
      label: `Pasta ${Math.floor(index / CARDS_PER_FOLDER) + 1}`,
      rangeLabel: `${start}–${end}`,
      startIndex: index,
      cards: chunk,
    })
  }

  return folders
}

function matchesSearch(card: Card, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  const english = (card.english_phrase || card.en || '').toLowerCase()
  const portuguese = (card.portuguese_translation || card.pt || '').toLowerCase()
  const synonyms = formatAcceptedTranslations(card.accepted_translations).toLowerCase()

  return (
    english.includes(normalized) ||
    portuguese.includes(normalized) ||
    synonyms.includes(normalized)
  )
}

export default function PackCardsOrganizer({
  cards,
  editingCardId,
  editForm,
  onEditFormChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRegenerateTts,
  onDelete,
}: PackCardsOrganizerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})

  const sortedCards = useMemo(() => sortCards(cards), [cards])
  const folders = useMemo(() => buildFolders(sortedCards), [sortedCards])

  const filteredFolders = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()
    if (!normalized) return folders

    return folders
      .map((folder) => ({
        ...folder,
        cards: folder.cards.filter((card) => matchesSearch(card, normalized)),
      }))
      .filter((folder) => folder.cards.length > 0)
  }, [folders, searchQuery])

  const isSearching = searchQuery.trim().length > 0
  const visibleCardCount = filteredFolders.reduce((sum, folder) => sum + folder.cards.length, 0)
  const missingAudioCount = sortedCards.filter((card) => !card.audio_url).length

  useEffect(() => {
    if (folders.length === 0) {
      setExpandedFolders({})
      return
    }

    setExpandedFolders((current) => {
      const next = { ...current }
      let changed = false

      for (const folder of folders) {
        if (next[folder.id] === undefined) {
          next[folder.id] = folder.id === folders[folders.length - 1].id
          changed = true
        }
      }

      for (const folderId of Object.keys(next)) {
        if (!folders.some((folder) => folder.id === folderId)) {
          delete next[folderId]
          changed = true
        }
      }

      return changed ? next : current
    })
  }, [folders])

  useEffect(() => {
    if (!editingCardId) return

    const folder = folders.find((item) => item.cards.some((card) => card.id === editingCardId))
    if (!folder) return

    setExpandedFolders((current) =>
      current[folder.id]
        ? current
        : {
            ...current,
            [folder.id]: true,
          }
    )
  }, [editingCardId, folders])

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((current) => ({
      ...current,
      [folderId]: !current[folderId],
    }))
  }

  const expandAll = () => {
    setExpandedFolders(
      Object.fromEntries(filteredFolders.map((folder) => [folder.id, true]))
    )
  }

  const collapseAll = () => {
    setExpandedFolders(
      Object.fromEntries(filteredFolders.map((folder) => [folder.id, false]))
    )
  }

  const renderCardRow = (card: Card, index: number) => {
    const isEditing = editingCardId === card.id
    const english = card.english_phrase || card.en || ''
    const portuguese = card.portuguese_translation || card.pt || ''

    if (isEditing) {
      return (
        <div
          key={card.id}
          className="border-b border-[var(--color-border)]/30 bg-[var(--color-surface-container-lowest)] p-4 last:border-b-0"
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
              <div className="space-y-1">
                <p className="ml-1 text-[9px] font-black uppercase tracking-widest text-[var(--color-text-subtle)]">
                  Inglês
                </p>
                <input
                  value={editForm.en}
                  onChange={(event) => onEditFormChange({ ...editForm, en: event.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-3 font-bold text-[var(--color-text)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface-container-lowest)] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <p className="ml-1 text-[9px] font-black uppercase tracking-widest text-[var(--color-text-subtle)]">
                  Tradução
                </p>
                <input
                  value={editForm.pt}
                  onChange={(event) => onEditFormChange({ ...editForm, pt: event.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-3 font-bold text-[var(--color-text)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface-container-lowest)] focus:outline-none"
                />
              </div>
              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <p className="ml-1 text-[9px] font-black uppercase tracking-widest text-[var(--color-text-subtle)]">
                  Sinônimos
                </p>
                <input
                  value={editForm.acceptedTranslations}
                  onChange={(event) =>
                    onEditFormChange({ ...editForm, acceptedTranslations: event.target.value })
                  }
                  placeholder="separados por ;"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-3 text-sm font-bold text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface-container-lowest)] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onSaveEdit(card.id)}
                className="btn-primary !rounded-xl p-3"
                aria-label="Salvar card"
              >
                <Save className="mx-auto h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="btn-ghost !rounded-xl p-3 text-[var(--color-text-subtle)]"
                aria-label="Cancelar edição do card"
              >
                <X className="mx-auto h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        key={card.id}
        className="group flex flex-col gap-2 border-b border-[var(--color-border)]/25 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-[var(--color-surface-container-low)]/70 sm:flex-row sm:items-center sm:gap-3"
      >
        <span className="w-8 shrink-0 text-[10px] font-black tabular-nums text-[var(--color-text-subtle)] opacity-60">
          {(index + 1).toString().padStart(2, '0')}
        </span>

        <div className="min-w-0 flex-1 sm:grid sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] sm:items-center sm:gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-bold text-[var(--color-text)]">{english}</span>
            {card.audio_url && <AudioButton url={card.audio_url} className="scale-75 shrink-0" />}
            {!card.audio_url && (
              <span className="shrink-0 rounded-full border border-[var(--color-accent-light)] bg-[var(--color-accent-light)]/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[var(--color-warning)]">
                Sem áudio
              </span>
            )}
          </div>
          <p className="truncate text-xs font-medium text-[var(--color-text-muted)] sm:text-sm">
            {portuguese}
          </p>
        </div>

        <div className="flex items-center justify-end gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onRegenerateTts(card.id, english)}
            className="rounded-md p-2 text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-primary)]"
            title="Refazer voz"
            aria-label={`Refazer voz do card ${english}`}
          >
            <Mic className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => onStartEdit(card)}
            className="rounded-md p-2 text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-primary)]"
            aria-label={`Editar card ${english}`}
          >
            <Edit2 className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(card)}
            className="rounded-md p-2 text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-error)]"
            aria-label={`Excluir card ${english}`}
          >
            <Trash2 className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h4 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
            Cards no pack
          </h4>
          <p className="mt-2 px-1 text-sm text-[var(--color-text-muted)]">
            {sortedCards.length} cards organizados em pastas de {CARDS_PER_FOLDER}.
            {missingAudioCount > 0 && (
              <span className="ml-1 font-semibold text-[var(--color-warning)]">
                {missingAudioCount} sem áudio.
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar frase ou tradução"
              className="field w-full py-2 pl-9 text-sm"
            />
          </div>
          {!isSearching && filteredFolders.length > 1 && (
            <div className="flex gap-2">
              <button type="button" onClick={expandAll} className="btn-ghost !rounded-lg px-3 py-2 text-xs">
                Abrir todas
              </button>
              <button type="button" onClick={collapseAll} className="btn-ghost !rounded-lg px-3 py-2 text-xs">
                Fechar todas
              </button>
            </div>
          )}
        </div>
      </div>

      {sortedCards.length === 0 ? (
        <div className="rounded-[1rem] border border-dashed border-[var(--color-border)] px-4 py-10 text-center">
          <p className="text-sm font-medium text-[var(--color-text-muted)]">Nenhum card neste pack ainda.</p>
        </div>
      ) : visibleCardCount === 0 ? (
        <div className="rounded-[1rem] border border-dashed border-[var(--color-border)] px-4 py-10 text-center">
          <p className="text-sm font-medium text-[var(--color-text-muted)]">Nenhum card corresponde à busca.</p>
        </div>
      ) : isSearching ? (
        <section className="overflow-hidden rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)]">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-3">
            <p className="text-sm font-bold text-[var(--color-text)]">
              Resultados da busca
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {visibleCardCount} {visibleCardCount === 1 ? 'card encontrado' : 'cards encontrados'}
            </p>
          </div>
          <div>
            {filteredFolders.flatMap((folder) =>
              folder.cards.map((card) => {
                const globalIndex = sortedCards.findIndex((item) => item.id === card.id)
                return renderCardRow(card, globalIndex)
              })
            )}
          </div>
        </section>
      ) : (
        <div className="space-y-3">
          {filteredFolders.map((folder) => {
            const isExpanded = expandedFolders[folder.id] ?? false
            const folderMissingAudio = folder.cards.filter((card) => !card.audio_url).length
            const FolderIcon = isExpanded ? FolderOpen : Folder

            return (
              <section
                key={folder.id}
                className="overflow-hidden rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)]"
              >
                <button
                  type="button"
                  onClick={() => toggleFolder(folder.id)}
                  className="flex w-full items-center gap-3 border-b border-[var(--color-border)]/60 bg-[var(--color-surface-container-low)] px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-container)]"
                  aria-expanded={isExpanded}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.75rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)]">
                    <FolderIcon className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-[var(--color-text)]">{folder.label}</p>
                      <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[var(--color-text-subtle)]">
                        Cards {folder.rangeLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      {folder.cards.length} {folder.cards.length === 1 ? 'frase' : 'frases'}
                      {folderMissingAudio > 0 && (
                        <span className="ml-1 text-[var(--color-warning)]">
                          · {folderMissingAudio} sem áudio
                        </span>
                      )}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-text-subtle)]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-subtle)]" />
                  )}
                </button>

                {isExpanded && (
                  <div className="max-h-[28rem] overflow-y-auto">
                    {folder.cards.map((card) => {
                      const globalIndex = sortedCards.findIndex((item) => item.id === card.id)
                      return renderCardRow(card, globalIndex)
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { setPacksFolderAction } from '@/app/actions'
import {
  groupPacksByFolder,
  MISC_PACK_FOLDER_LABEL,
} from '@/features/cards/lib/packFolders'
import {
  fieldClass,
  ghostBtn,
  glassTile,
  iconClass,
  nestedCardClass,
  neutralBadge,
  primaryBtn,
  sectionDivider,
  softKicker,
} from '@/features/admin/lib/adminUi'
import { notify } from '@/lib/toast'
import type { Card, Pack } from '@/types/database.types'

type PackWithCards = Pack & { cards: Card[] }

type PackFolder = {
  id: string
  label: string
  packs: PackWithCards[]
  totalCards: number
}

const difficultyConfig: Record<string, { label: string; className: string }> = {
  easy: {
    label: 'Fácil',
    className: 'border border-brand-dark/20 bg-bg-primary text-brand-dark',
  },
  medium: {
    label: 'Médio',
    className: 'border border-brand-dark/20 bg-brand-accent/30 text-brand-dark',
  },
  hard: {
    label: 'Difícil',
    className: 'border border-brand-dark/30 bg-bg-primary text-brand-dark',
  },
  A1: {
    label: 'A1',
    className: 'border border-brand-dark/20 bg-bg-primary text-brand-dark',
  },
  A2: {
    label: 'A2',
    className: 'border border-brand-dark/20 bg-bg-primary text-brand-dark',
  },
  B1: {
    label: 'B1',
    className: 'border border-brand-dark/20 bg-brand-accent/30 text-brand-dark',
  },
  B2: {
    label: 'B2',
    className: 'border border-brand-dark/20 bg-brand-accent/30 text-brand-dark',
  },
  C1: {
    label: 'C1',
    className: 'border border-brand-dark/30 bg-bg-primary text-brand-dark',
  },
  C2: {
    label: 'C2',
    className: 'border border-brand-dark/30 bg-bg-primary text-brand-dark',
  },
}

function folderNameToStorage(label: string) {
  return label.trim() === MISC_PACK_FOLDER_LABEL ? null : label.trim()
}

function buildPackFolders(packs: PackWithCards[]): PackFolder[] {
  return groupPacksByFolder(packs).map((folder) => ({
    ...folder,
    totalCards: folder.packs.reduce((sum, pack) => sum + (pack.cards?.length || 0), 0),
  }))
}

function matchesPackSearch(pack: PackWithCards, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  return (
    pack.name.toLowerCase().includes(normalized) ||
    (pack.description || '').toLowerCase().includes(normalized) ||
    (pack.category || '').toLowerCase().includes(normalized)
  )
}

type PackLibraryOrganizerProps = {
  packs: PackWithCards[]
  selectedPackId: string | null
  onSelectPack: (packId: string) => void
  onRefresh: () => void
}

export default function PackLibraryOrganizer({
  packs,
  selectedPackId,
  onSelectPack,
  onRefresh,
}: PackLibraryOrganizerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [newFolderPackId, setNewFolderPackId] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [isPending, startTransition] = useTransition()

  const folders = useMemo(() => buildPackFolders(packs), [packs])
  const folderLabels = useMemo(() => folders.map((folder) => folder.label), [folders])

  const filteredFolders = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()
    if (!normalized) return folders

    return folders
      .map((folder) => ({
        ...folder,
        packs: folder.packs.filter((pack) => matchesPackSearch(pack, normalized)),
        totalCards: folder.packs
          .filter((pack) => matchesPackSearch(pack, normalized))
          .reduce((sum, pack) => sum + (pack.cards?.length || 0), 0),
      }))
      .filter((folder) => folder.packs.length > 0)
  }, [folders, searchQuery])

  const isSearching = searchQuery.trim().length > 0
  const visiblePackCount = filteredFolders.reduce((sum, folder) => sum + folder.packs.length, 0)

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
          next[folder.id] = folders.length === 1
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
    if (!selectedPackId) return

    const folder = folders.find((item) => item.packs.some((pack) => pack.id === selectedPackId))
    if (!folder) return

    setExpandedFolders((current) =>
      current[folder.id]
        ? current
        : {
            ...current,
            [folder.id]: true,
          }
    )
  }, [folders, selectedPackId])

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((current) => ({
      ...current,
      [folderId]: !current[folderId],
    }))
  }

  const expandAll = () => {
    setExpandedFolders(Object.fromEntries(filteredFolders.map((folder) => [folder.id, true])))
  }

  const collapseAll = () => {
    setExpandedFolders(Object.fromEntries(filteredFolders.map((folder) => [folder.id, false])))
  }

  const persistFolderChange = (
    packIds: string[],
    folderName: string | null,
    successMessage: string
  ) => {
    startTransition(async () => {
      const result = await setPacksFolderAction(packIds, folderName)
      if (result.error) {
        notify.error(result.error)
        return
      }

      notify.success(successMessage)
      setRenamingFolderId(null)
      setRenameValue('')
      setNewFolderPackId(null)
      setNewFolderName('')
      onRefresh()
    })
  }

  const startRenameFolder = (folder: PackFolder) => {
    setRenamingFolderId(folder.id)
    setRenameValue(folder.label)
  }

  const cancelRenameFolder = () => {
    setRenamingFolderId(null)
    setRenameValue('')
  }

  const saveRenameFolder = (folder: PackFolder) => {
    const nextName = renameValue.trim()
    if (!nextName) {
      notify.error('Digite um nome para a pasta.')
      return
    }

    if (nextName === folder.label) {
      cancelRenameFolder()
      return
    }

    if (folderLabels.some((label) => label.toLowerCase() === nextName.toLowerCase() && label !== folder.label)) {
      notify.error('Já existe uma pasta com esse nome.')
      return
    }

    persistFolderChange(
      folder.packs.map((pack) => pack.id),
      folderNameToStorage(nextName),
      `Pasta renomeada para "${nextName}".`
    )
  }

  const movePackToFolder = (packId: string, targetLabel: string) => {
    const normalizedTarget = targetLabel.trim()
    if (!normalizedTarget) return

    if (normalizedTarget === MISC_PACK_FOLDER_LABEL) {
      persistFolderChange([packId], null, 'Pack movido para Outros packs.')
      return
    }

    persistFolderChange([packId], normalizedTarget, `Pack movido para "${normalizedTarget}".`)
  }

  const confirmNewFolderMove = () => {
    if (!newFolderPackId) return

    const nextName = newFolderName.trim()
    if (!nextName) {
      notify.error('Digite o nome da nova pasta.')
      return
    }

    if (folderLabels.some((label) => label.toLowerCase() === nextName.toLowerCase())) {
      notify.error('Já existe uma pasta com esse nome.')
      return
    }

    movePackToFolder(newFolderPackId, nextName)
  }

  const renderPackRow = (pack: PackWithCards, currentFolderLabel: string) => {
    const isSelected = selectedPackId === pack.id
    const difficulty =
      difficultyConfig[pack.level || ''] || {
        label: 'Nível —',
        className: 'border border-brand-dark/20 bg-bg-primary text-brand-secondary',
      }

    const moveTargets = folderLabels.filter((label) => label !== currentFolderLabel)

    return (
      <div
        key={pack.id}
        className={`flex flex-col gap-2 border-b-2 border-brand-dark/10 px-3 py-2 last:border-b-0 sm:flex-row sm:items-center sm:gap-3 ${
          isSelected ? 'bg-brand-accent/20' : 'hover:bg-bg-primary'
        }`}
      >
        <button
          type="button"
          onClick={() => onSelectPack(pack.id)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-pressed={isSelected}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
              isSelected
                ? 'border-brand-dark bg-brand-accent text-brand-dark'
                : 'border-brand-dark/30 bg-bg-primary text-brand-secondary'
            }`}
          >
            <Package className="h-4 w-4" strokeWidth={2} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-sm font-bold text-brand-dark">{pack.name}</p>
            {pack.description && (
              <p className="mt-0.5 truncate font-body text-xs text-brand-secondary">{pack.description}</p>
            )}
          </div>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <span className={`rounded-lg px-2 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wide ${difficulty.className}`}>
              {difficulty.label}
            </span>
            <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
              {pack.cards?.length || 0} cards
            </span>
          </div>

          <ChevronRight
            className={`h-4 w-4 shrink-0 transition-colors sm:hidden ${
              isSelected ? 'text-brand-dark' : 'text-brand-secondary'
            }`}
          />
        </button>

        <div className="flex items-center gap-2 sm:w-48 sm:shrink-0">
          {newFolderPackId === pack.id ? (
            <>
              <input
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                placeholder="Nome da pasta"
                className={`${fieldClass} flex-1 py-2 text-xs`}
                disabled={isPending}
              />
              <button
                type="button"
                onClick={confirmNewFolderMove}
                disabled={isPending}
                className={`${primaryBtn} px-2.5 py-2`}
                aria-label="Criar pasta e mover pack"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewFolderPackId(null)
                  setNewFolderName('')
                }}
                disabled={isPending}
                className={`${ghostBtn} px-2.5 py-2`}
                aria-label="Cancelar nova pasta"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <select
              defaultValue=""
              disabled={isPending}
              onChange={(event) => {
                const value = event.target.value
                event.currentTarget.value = ''
                if (!value) return

                if (value === '__new__') {
                  setNewFolderPackId(pack.id)
                  setNewFolderName('')
                  return
                }

                if (value === '__misc__') {
                  movePackToFolder(pack.id, MISC_PACK_FOLDER_LABEL)
                  return
                }

                movePackToFolder(pack.id, value)
              }}
              className={`${fieldClass} w-full py-2 text-xs`}
              aria-label={`Mover ${pack.name} para outra pasta`}
            >
              <option value="" disabled>
                Mover para...
              </option>
              {moveTargets.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
              {currentFolderLabel !== MISC_PACK_FOLDER_LABEL && (
                <option value="__misc__">{MISC_PACK_FOLDER_LABEL}</option>
              )}
              <option value="__new__">+ Nova pasta...</option>
            </select>
          )}
        </div>
      </div>
    )
  }

  const renderFolderHeader = (folder: PackFolder, isExpanded: boolean) => {
    const FolderIcon = isExpanded ? FolderOpen : Folder
    const isRenaming = renamingFolderId === folder.id

    return (
      <div className={`flex items-center gap-2 bg-bg-primary px-3 py-3 sm:px-4 ${sectionDivider}`}>
        <button
          type="button"
          onClick={() => toggleFolder(folder.id)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left transition-colors hover:opacity-90"
          aria-expanded={isExpanded}
        >
          <span className={`${iconClass} h-10 w-10`}>
            <FolderIcon className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            {isRenaming ? (
              <input
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    saveRenameFolder(folder)
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    cancelRenameFolder()
                  }
                }}
                className={`${fieldClass} w-full py-2 text-sm font-bold`}
                autoFocus
                disabled={isPending}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-heading text-base font-bold text-brand-dark">{folder.label}</p>
                  <span className={neutralBadge}>
                    {folder.packs.length} {folder.packs.length === 1 ? 'pack' : 'packs'}
                  </span>
                </div>
                <p className="mt-0.5 font-body text-xs text-brand-secondary">
                  {folder.totalCards} cards no total
                </p>
              </>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-brand-secondary" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-brand-secondary" />
          )}
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {isRenaming ? (
            <>
              <button
                type="button"
                onClick={() => saveRenameFolder(folder)}
                disabled={isPending}
                className={`${primaryBtn} px-2.5 py-2`}
                aria-label="Salvar nome da pasta"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={cancelRenameFolder}
                disabled={isPending}
                className={`${ghostBtn} px-2.5 py-2`}
                aria-label="Cancelar renomear pasta"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => startRenameFolder(folder)}
              disabled={isPending}
              className={`${ghostBtn} px-2.5 py-2`}
              aria-label={`Renomear pasta ${folder.label}`}
              title="Renomear pasta"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className={`${glassTile} space-y-4 p-4 sm:p-5`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className={softKicker}>Biblioteca de packs</span>
          <p className="mt-3 px-1 font-body text-sm text-brand-secondary">
            {packs.length} {packs.length === 1 ? 'pack' : 'packs'} em {folders.length}{' '}
            {folders.length === 1 ? 'pasta' : 'pastas'}. Renomeie pastas ou mova packs pelo menu ao lado de cada item.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar pack, série ou categoria"
              className={`${fieldClass} w-full py-2 pl-9 text-sm`}
            />
          </div>
          {filteredFolders.length > 1 && (
            <div className="flex gap-2">
              <button type="button" onClick={expandAll} className={`${ghostBtn} px-3 py-2 text-xs`}>
                Abrir todas
              </button>
              <button type="button" onClick={collapseAll} className={`${ghostBtn} px-3 py-2 text-xs`}>
                Fechar todas
              </button>
            </div>
          )}
        </div>
      </div>

      {packs.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-brand-dark/30 px-4 py-10 text-center">
          <p className="font-body text-sm font-medium text-brand-secondary">Nenhum pack criado ainda.</p>
        </div>
      ) : visiblePackCount === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-brand-dark/30 px-4 py-10 text-center">
          <p className="font-body text-sm font-medium text-brand-secondary">Nenhum pack corresponde à busca.</p>
        </div>
      ) : isSearching ? (
        <div className={`${nestedCardClass} overflow-hidden`}>
          <div className={`bg-bg-primary px-4 py-3 ${sectionDivider}`}>
            <p className="font-body text-sm font-bold text-brand-dark">Resultados da busca</p>
            <p className="mt-0.5 font-body text-xs text-brand-secondary">
              {visiblePackCount} {visiblePackCount === 1 ? 'pack encontrado' : 'packs encontrados'}
            </p>
          </div>
          <div>
            {filteredFolders.flatMap((folder) =>
              folder.packs.map((pack) => renderPackRow(pack, folder.label))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFolders.map((folder) => {
            const isExpanded = expandedFolders[folder.id] ?? false
            const hasSelectedPack = folder.packs.some((pack) => pack.id === selectedPackId)

            return (
              <section
                key={folder.id}
                className={`overflow-hidden rounded-xl border-2 bg-bg-card ${
                  hasSelectedPack
                    ? 'border-brand-accent shadow-[4px_4px_0_var(--color-brand-dark)]'
                    : 'border-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]'
                }`}
              >
                {renderFolderHeader(folder, isExpanded)}
                {isExpanded && (
                  <div>{folder.packs.map((pack) => renderPackRow(pack, folder.label))}</div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {newFolderPackId && !isSearching && (
        <p className="flex items-center gap-2 px-1 font-body text-xs text-brand-secondary">
          <Plus className="h-3.5 w-3.5 text-brand-dark" />
          Digite o nome da nova pasta e confirme com o botão verde.
        </p>
      )}
    </section>
  )
}
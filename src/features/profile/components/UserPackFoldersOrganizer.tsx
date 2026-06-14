'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { setUserPacksFolderAction } from '@/app/profile-pack-actions'
import {
  groupUserPacksByFolder,
  USER_MISC_PACK_FOLDER_LABEL,
  userFolderNameToStorage,
} from '@/features/cards/lib/packFolders'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { notify } from '@/lib/toast'
import { m } from 'framer-motion'
import type { UserPackSummary } from './UserPacksManager'

type UserPackFolder = {
  id: string
  label: string
  packs: UserPackSummary[]
}

type UserPackFoldersOrganizerProps = {
  packs: UserPackSummary[]
  extraFolders: string[]
  onExtraFoldersChange: (folders: string[]) => void
  onAddToPack: (packId: string) => void
  onRequestDelete: (pack: UserPackSummary) => void
  deletingPackId: string | null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export default function UserPackFoldersOrganizer({
  packs,
  extraFolders,
  onExtraFoldersChange,
  onAddToPack,
  onRequestDelete,
  deletingPackId,
}: UserPackFoldersOrganizerProps) {
  const router = useRouter()
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [newFolderPackId, setNewFolderPackId] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [createFolderName, setCreateFolderName] = useState('')
  const [isPending, startTransition] = useTransition()

  const packFolders = useMemo(
    () =>
      groupUserPacksByFolder(
        packs.map((pack) => ({
          ...pack,
          name: pack.name,
          category: pack.category,
        }))
      ),
    [packs]
  )

  const folderLabels = useMemo(() => {
    const labels = new Set(packFolders.map((folder) => folder.label))
    for (const folder of extraFolders) {
      labels.add(folder)
    }
    return [...labels].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }))
  }, [packFolders, extraFolders])

  const displayFolders = useMemo(() => {
    const folders: UserPackFolder[] = packFolders.map((folder) => ({
      id: folder.id,
      label: folder.label,
      packs: folder.packs as UserPackSummary[],
    }))

    for (const label of extraFolders) {
      if (!folders.some((folder) => folder.label.toLowerCase() === label.toLowerCase())) {
        folders.push({
          id: `pending-${label.toLowerCase()}`,
          label,
          packs: [],
        })
      }
    }

    return folders.sort((a, b) => {
      const miscId = `folder-${USER_MISC_PACK_FOLDER_LABEL.toLowerCase()}`
      if (a.id === miscId) return 1
      if (b.id === miscId) return -1
      return a.label.localeCompare(b.label, 'pt-BR', { numeric: true })
    })
  }, [packFolders, extraFolders])

  useEffect(() => {
    setExpandedFolders((current) => {
      const next = { ...current }
      let changed = false

      for (const folder of displayFolders) {
        if (next[folder.id] === undefined) {
          next[folder.id] = displayFolders.length <= 2
          changed = true
        }
      }

      for (const folderId of Object.keys(next)) {
        if (!displayFolders.some((folder) => folder.id === folderId)) {
          delete next[folderId]
          changed = true
        }
      }

      return changed ? next : current
    })
  }, [displayFolders])

  const persistFolderChange = (
    packIds: string[],
    folderName: string | null,
    successMessage: string,
    createdFolderName?: string
  ) => {
    startTransition(async () => {
      const result = await setUserPacksFolderAction(packIds, folderName)
      if (!result.success) {
        notify.error(result.error)
        return
      }

      notify.success(successMessage)
      setRenamingFolderId(null)
      setRenameValue('')
      setNewFolderPackId(null)
      setNewFolderName('')
      setCreatingFolder(false)
      setCreateFolderName('')

      if (createdFolderName) {
        onExtraFoldersChange(
          extraFolders.filter((folder) => folder.toLowerCase() !== createdFolderName.toLowerCase())
        )
      }

      router.refresh()
    })
  }

  const startRenameFolder = (folder: UserPackFolder) => {
    if (folder.label === USER_MISC_PACK_FOLDER_LABEL) return
    setRenamingFolderId(folder.id)
    setRenameValue(folder.label)
  }

  const cancelRenameFolder = () => {
    setRenamingFolderId(null)
    setRenameValue('')
  }

  const saveRenameFolder = (folder: UserPackFolder) => {
    const nextName = renameValue.trim()
    if (!nextName) {
      notify.error('Digite um nome para a pasta.')
      return
    }

    if (nextName === folder.label) {
      cancelRenameFolder()
      return
    }

    if (
      folderLabels.some(
        (label) => label.toLowerCase() === nextName.toLowerCase() && label !== folder.label
      )
    ) {
      notify.error('Já existe uma pasta com esse nome na sua biblioteca.')
      return
    }

    if (folder.packs.length === 0) {
      onExtraFoldersChange(
        extraFolders.map((label) => (label === folder.label ? nextName : label))
      )
      cancelRenameFolder()
      notify.success(`Pasta renomeada para "${nextName}".`)
      return
    }

    persistFolderChange(
      folder.packs.map((pack) => pack.id),
      userFolderNameToStorage(nextName),
      `Pasta renomeada para "${nextName}".`
    )
  }

  const movePackToFolder = (packId: string, targetLabel: string) => {
    const normalizedTarget = targetLabel.trim()
    if (!normalizedTarget) return

    if (normalizedTarget === USER_MISC_PACK_FOLDER_LABEL) {
      persistFolderChange([packId], null, 'Pack movido para Sem pasta.')
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
      notify.error('Já existe uma pasta com esse nome na sua biblioteca.')
      return
    }

    persistFolderChange(
      [newFolderPackId],
      nextName,
      `Pack movido para "${nextName}".`,
      nextName
    )
  }

  const confirmCreateFolder = () => {
    const nextName = createFolderName.trim()
    if (!nextName) {
      notify.error('Digite o nome da nova pasta.')
      return
    }

    if (folderLabels.some((label) => label.toLowerCase() === nextName.toLowerCase())) {
      notify.error('Já existe uma pasta com esse nome na sua biblioteca.')
      return
    }

    onExtraFoldersChange([...extraFolders, nextName])
    setCreatingFolder(false)
    setCreateFolderName('')
    notify.success(`Pasta "${nextName}" criada. Mova packs para ela ou crie um novo pack nessa pasta.`)
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((current) => ({
      ...current,
      [folderId]: !current[folderId],
    }))
  }

  const renderPackCard = (pack: UserPackSummary, currentFolderLabel: string) => {
    const moveTargets = folderLabels.filter((label) => label !== currentFolderLabel)

    return (
      <m.article
        key={pack.id}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.25 }}
        className="premium-card p-5 relative overflow-hidden group flex flex-col justify-between"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[var(--color-primary-light)]/5 pointer-events-none" />

        <div>
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-[#b8ff5c]/10 dark:text-[#b8ff5c] dark:border-[#b8ff5c]/20">
                  <Lock className="h-3.5 w-3.5" />
                  Privado
                </span>
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary-light)]">
                  <Folder className="h-3 w-3" />
                  {currentFolderLabel}
                </span>
                <span className="text-[10px] font-semibold text-[var(--color-text-subtle)]">
                  {formatDate(pack.createdAt)}
                </span>
              </div>
              <h3 className="mt-3 truncate text-base font-extrabold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors leading-snug">
                {pack.name}
              </h3>
              {pack.description && (
                <p className="mt-1.5 line-clamp-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
                  {pack.description}
                </p>
              )}
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-container)] text-[var(--color-primary)] shadow-sm">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 relative z-10">
            <div className="rounded-xl border border-[var(--color-border)]/65 bg-[var(--color-surface-container-lowest)] p-3 text-center">
              <p className="text-xl font-extrabold text-[var(--color-text)]">{pack.cardCount}</p>
              <p className="text-[10px] font-bold text-[var(--color-text-subtle)] uppercase">Cards</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)]/65 bg-[var(--color-surface-container-lowest)] p-3 text-center">
              <p className="truncate text-xs font-extrabold text-[var(--color-text)] uppercase tracking-wider">
                {pack.assignmentStatus === 'completed' ? 'Completo' : 'Estudando'}
              </p>
              <p className="text-[10px] font-bold text-[var(--color-text-subtle)] uppercase">Rotina</p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3 border-t border-[var(--color-border)]/45 pt-4 relative z-10">
          {newFolderPackId === pack.id ? (
            <div className="flex items-center gap-2">
              <input
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                placeholder="Nome da pasta"
                className="field flex-1 py-2 text-xs"
                disabled={isPending}
              />
              <button
                type="button"
                onClick={confirmNewFolderMove}
                disabled={isPending}
                className="btn-primary !rounded-lg px-2.5 py-2"
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
                className="btn-ghost !rounded-lg px-2.5 py-2"
                aria-label="Cancelar nova pasta"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
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
                  movePackToFolder(pack.id, USER_MISC_PACK_FOLDER_LABEL)
                  return
                }

                movePackToFolder(pack.id, value)
              }}
              className="field w-full py-2 text-xs"
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
              {currentFolderLabel !== USER_MISC_PACK_FOLDER_LABEL && (
                <option value="__misc__">{USER_MISC_PACK_FOLDER_LABEL}</option>
              )}
              <option value="__new__">+ Nova pasta...</option>
            </select>
          )}

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {pack.assignmentId ? (
              <Link
                href={`/play/${pack.assignmentId}`}
                transitionTypes={navForwardTransitionTypes}
                className="btn-primary inline-flex h-10 items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold sm:h-9"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Estudar
              </Link>
            ) : (
              <Link
                href="/home"
                transitionTypes={navForwardTransitionTypes}
                className="btn-primary inline-flex h-10 items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold sm:h-9"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Iniciar Rotina
              </Link>
            )}
            <button
              type="button"
              onClick={() => onAddToPack(pack.id)}
              className="btn-ghost inline-flex h-10 items-center justify-center gap-1.5 bg-[var(--color-surface-container)] px-3 py-2 text-xs font-bold text-[var(--color-text)] hover:bg-[var(--color-surface-container-high)] sm:h-9"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              Adicionar
            </button>
            <button
              type="button"
              onClick={() => onRequestDelete(pack)}
              disabled={deletingPackId === pack.id}
              className="btn-ghost col-span-2 inline-flex h-10 items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-[var(--color-error)] hover:bg-red-500/5 hover:text-red-600 sm:col-span-1 sm:ml-auto sm:h-9"
            >
              {deletingPackId === pack.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Excluir
            </button>
          </div>
        </div>
      </m.article>
    )
  }

  const renderFolderHeader = (folder: UserPackFolder, isExpanded: boolean) => {
    const FolderIcon = isExpanded ? FolderOpen : Folder
    const isRenaming = renamingFolderId === folder.id
    const canRename = folder.label !== USER_MISC_PACK_FOLDER_LABEL

    return (
      <div className="flex min-h-11 flex-col gap-3 border-b border-[var(--color-border)]/60 bg-[var(--color-surface-container-low)] px-4 py-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => toggleFolder(folder.id)}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left transition-colors hover:opacity-90"
          aria-expanded={isExpanded}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)]">
            <FolderIcon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            {isRenaming ? (
              <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                <input
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  className="field flex-1 py-2 text-sm font-bold"
                  disabled={isPending}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => saveRenameFolder(folder)}
                  disabled={isPending}
                  className="btn-primary !rounded-lg px-2.5 py-2"
                  aria-label="Salvar nome da pasta"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={cancelRenameFolder}
                  disabled={isPending}
                  className="btn-ghost !rounded-lg px-2.5 py-2"
                  aria-label="Cancelar renomear pasta"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <p className="truncate text-base font-extrabold text-[var(--color-text)]">{folder.label}</p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  Pasta privada · {folder.packs.length}{' '}
                  {folder.packs.length === 1 ? 'pack' : 'packs'}
                </p>
              </>
            )}
          </div>
          <span className="shrink-0 text-[var(--color-text-subtle)]">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
        </button>

        {!isRenaming && canRename && (
          <button
            type="button"
            onClick={() => startRenameFolder(folder)}
            disabled={isPending}
            className="btn-ghost self-start px-3 py-2 text-xs font-bold sm:self-center"
            aria-label={`Renomear pasta ${folder.label}`}
          >
            <Pencil className="h-3.5 w-3.5" />
            Renomear
          </button>
        )}
      </div>
    )
  }

  if (displayFolders.length === 0 && !creatingFolder) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-8 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-[var(--color-primary)] opacity-60" />
        <p className="mt-3 font-extrabold text-sm text-[var(--color-text)]">Nenhum pacote próprio criado</p>
        <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
          Use o gerador manual ou IA acima para começar a sua própria biblioteca privada.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-kicker">Organização privada</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Suas pastas são exclusivas da sua conta. Outros membros só veem o que você publicar.
          </p>
        </div>

        {creatingFolder ? (
          <div className="flex w-full max-w-md items-center gap-2 sm:w-auto">
            <input
              value={createFolderName}
              onChange={(event) => setCreateFolderName(event.target.value)}
              placeholder="Nome da nova pasta"
              className="field flex-1 py-2 text-sm font-bold"
              disabled={isPending}
              autoFocus
            />
            <button
              type="button"
              onClick={confirmCreateFolder}
              disabled={isPending}
              className="btn-primary !rounded-lg px-2.5 py-2"
              aria-label="Confirmar nova pasta"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCreatingFolder(false)
                setCreateFolderName('')
              }}
              disabled={isPending}
              className="btn-ghost !rounded-lg px-2.5 py-2"
              aria-label="Cancelar nova pasta"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreatingFolder(true)}
            className="btn-ghost px-4 py-2 text-xs font-bold self-start sm:self-auto"
          >
            <FolderPlus className="h-4 w-4" />
            Nova pasta
          </button>
        )}
      </div>

      <div className="space-y-4">
        {displayFolders.map((folder) => {
          const isExpanded = expandedFolders[folder.id] ?? true

          return (
            <div
              key={folder.id}
              className="overflow-hidden rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-surface-container-lowest)]"
            >
              {renderFolderHeader(folder, isExpanded)}

              {isExpanded && (
                <div className="p-4">
                  {folder.packs.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {folder.packs.map((pack) => renderPackCard(pack, folder.label))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[var(--color-border)]/70 bg-[var(--color-surface-container-low)] px-4 py-6 text-center">
                      <p className="text-sm font-bold text-[var(--color-text)]">Pasta vazia</p>
                      <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
                        Mova um pack para cá ou crie um novo pack selecionando esta pasta.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
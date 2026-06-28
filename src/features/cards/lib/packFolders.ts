import {
  CEFR_LEVELS,
  normalizePackLevel,
  CEFR_LEVEL_LABELS,
  type CefrLevel,
} from '@/features/cefr/lib/cefrLevels'

export const MISC_PACK_FOLDER_LABEL = 'Outros packs'
export const USER_MISC_PACK_FOLDER_LABEL = 'Sem pasta'

export type PackFolderSource = {
  name: string
  category?: string | null
  level?: string | null
}

export function getPackFolderLabel(pack: PackFolderSource): string {
  const category = pack.category?.trim()
  if (category) return category

  const seriesMatch = pack.name.trim().match(/^(.+?)\s+(\d+)$/i)
  if (seriesMatch) return seriesMatch[1].trim()

  return MISC_PACK_FOLDER_LABEL
}

export function getPackFolderId(label: string): string {
  if (label === MISC_PACK_FOLDER_LABEL) return 'misc'
  return `folder-${label.toLowerCase()}`
}

export function parsePackOrderNumber(name: string): number {
  const match = name.trim().match(/(\d+)\s*$/)
  return match ? Number.parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER
}

export type PackFolderGroup<T extends PackFolderSource> = {
  id: string
  label: string
  packs: T[]
}

export function getUserPackFolderLabel(pack: PackFolderSource): string {
  const category = pack.category?.trim()
  if (category) return category

  const seriesMatch = pack.name.trim().match(/^(.+?)\s+(\d+)$/i)
  if (seriesMatch) return seriesMatch[1].trim()

  return USER_MISC_PACK_FOLDER_LABEL
}

export function groupUserPacksByFolder<T extends PackFolderSource>(packs: T[]): PackFolderGroup<T>[] {
  const folderMap = new Map<string, PackFolderGroup<T>>()

  for (const pack of packs) {
    const label = getUserPackFolderLabel(pack)
    const id = getPackFolderId(label)
    const existing = folderMap.get(id)

    if (existing) {
      existing.packs.push(pack)
      continue
    }

    folderMap.set(id, { id, label, packs: [pack] })
  }

  return [...folderMap.values()]
    .map((folder) => ({
      ...folder,
      packs: [...folder.packs].sort((a, b) => {
        const orderA = parsePackOrderNumber(a.name)
        const orderB = parsePackOrderNumber(b.name)
        if (orderA !== orderB) return orderA - orderB
        return a.name.localeCompare(b.name, 'pt-BR', { numeric: true })
      }),
    }))
    .sort((a, b) => {
      const miscId = getPackFolderId(USER_MISC_PACK_FOLDER_LABEL)
      if (a.id === miscId) return 1
      if (b.id === miscId) return -1
      return a.label.localeCompare(b.label, 'pt-BR', { numeric: true })
    })
}

export function userFolderNameToStorage(label: string): string | null {
  return label.trim() === USER_MISC_PACK_FOLDER_LABEL ? null : label.trim()
}

function normalizeCatalogPackLevel(level: string | null | undefined): CefrLevel {
  if (!level) return 'A2'

  const upper = level.trim().toUpperCase()
  for (const band of CEFR_LEVELS) {
    if (upper === band || upper.includes(band)) return band
  }

  return normalizePackLevel(level)
}

export function groupPacksByFolder<T extends PackFolderSource>(packs: T[]): PackFolderGroup<T>[] {
  const folderMap = new Map<string, PackFolderGroup<T>>()

  for (const pack of packs) {
    const label = getPackFolderLabel(pack)
    const id = getPackFolderId(label)
    const existing = folderMap.get(id)

    if (existing) {
      existing.packs.push(pack)
      continue
    }

    folderMap.set(id, { id, label, packs: [pack] })
  }

  return [...folderMap.values()]
    .map((folder) => ({
      ...folder,
      packs: [...folder.packs].sort((a, b) => {
        const orderA = parsePackOrderNumber(a.name)
        const orderB = parsePackOrderNumber(b.name)
        if (orderA !== orderB) return orderA - orderB
        return a.name.localeCompare(b.name, 'pt-BR', { numeric: true })
      }),
    }))
    .sort((a, b) => {
      if (a.id === 'misc') return 1
      if (b.id === 'misc') return -1
      return a.label.localeCompare(b.label, 'pt-BR', { numeric: true })
    })
}

export function groupPacksByLevel<T extends PackFolderSource>(packs: T[]): PackFolderGroup<T>[] {
  const levelMap = new Map<string, PackFolderGroup<T>>()

  for (const lvl of CEFR_LEVELS) {
    const label = `${CEFR_LEVEL_LABELS[lvl]} (${lvl})`
    levelMap.set(lvl, { id: `level-${lvl.toLowerCase()}`, label, packs: [] })
  }

  for (const pack of packs) {
    const lvl = normalizeCatalogPackLevel(pack.level)
    const group = levelMap.get(lvl)
    if (group) {
      group.packs.push(pack)
    }
  }

  return [...levelMap.values()]
    .filter((group) => group.packs.length > 0)
    .map((group) => ({
      ...group,
      packs: [...group.packs].sort((a, b) => {
        const orderA = parsePackOrderNumber(a.name)
        const orderB = parsePackOrderNumber(b.name)
        if (orderA !== orderB) return orderA - orderB
        return a.name.localeCompare(b.name, 'pt-BR', { numeric: true })
      }),
    }))
}

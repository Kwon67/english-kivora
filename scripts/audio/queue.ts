export interface InventoryClip {
  key: string
  text: string
  voice: 'siren' | 'lauren' | 'jarnathan'
  state: string
  priority: boolean
  feature: string
}
export function migrationQueue(rows: InventoryClip[]) {
  const publicKeys = new Set(rows.filter((r) => r.feature.startsWith('Snapshot · ')).map((r) => r.key))
  const ranked = new Map<string, InventoryClip & { rank: number }>()
  for (const row of rows) {
    const catalog = row.feature.startsWith('Catálogo · ') || row.feature.startsWith('Snapshot · ')
    if (catalog && !publicKeys.has(row.key)) continue
    const rank = row.feature.startsWith('travel-')
      ? 0
      : !catalog && !row.feature.startsWith('Blitz')
        ? 1
        : row.priority
          ? 2
          : row.feature.startsWith('Blitz') && publicKeys.has(row.key)
            ? 3
            : 4
    if (row.feature.startsWith('Blitz') && !publicKeys.has(row.key)) continue
    if (!ranked.has(row.key) || ranked.get(row.key)!.rank > rank) ranked.set(row.key, { ...row, rank })
  }
  return [...ranked.values()].sort((a, b) => a.rank - b.rank || a.key.localeCompare(b.key))
}

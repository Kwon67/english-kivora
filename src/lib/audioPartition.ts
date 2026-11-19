// Only partitions public lookup tables. The full normalized text and voice are
// checked inside the partition before selecting an asset.
export function audioPartition(key: string) {
  let hash = 2166136261
  for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619)
  return (hash & 255).toString(16).padStart(2, '0')
}

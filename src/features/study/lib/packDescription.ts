/**
 * Pack descriptions come partly from `.apkg` imports, which write machine strings like
 * "Imported from Pack10_EnglishPhrases.apkg" into the description column. Those are build
 * artifacts, not copy, and they read as noise on every routine card. Filter them out so the
 * caller's friendly fallback shows instead.
 */

const IMPORT_ARTIFACT_PATTERNS = [
  /^imported from\b/i,
  /\.apkg\b/i,
  /^deck gerado automaticamente\b/i,
]

export function getDisplayPackDescription(
  description: string | null | undefined,
  fallback: string
): string {
  const trimmed = description?.trim()
  if (!trimmed) return fallback
  if (IMPORT_ARTIFACT_PATTERNS.some((pattern) => pattern.test(trimmed))) return fallback
  return trimmed
}

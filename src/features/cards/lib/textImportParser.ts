// Parse text/csv format for bulk import
export function parseBulkImport(text: string): { front: string; back: string }[] {
  const cards: { front: string; back: string }[] = []
  
  const lines = text.split('\n').filter(line => line.trim())
  
  for (const line of lines) {
    // Try different separators: tab, pipe, comma
    const separators = ['\t', '|', ',']
    let parts: string[] = []
    
    for (const sep of separators) {
      parts = line.split(sep).map(p => p.trim())
      if (parts.length >= 2) break
    }
    
    if (parts.length >= 2) {
      cards.push({
        front: parts[0],
        back: parts[1]
      })
    }
  }
  
  return cards
}

// Parse JSON format
export function parseJsonImport(json: string): { name: string; cards: { front: string; back: string }[] } | null {
  try {
    const data = JSON.parse(json) as unknown
    
    if (Array.isArray(data)) {
      // Array of cards
      return {
        name: 'Imported Deck',
        cards: data.map((item: Record<string, unknown>) => ({
          front: String(item.en || item.front || item.question || ''),
          back: String(item.pt || item.back || item.answer || '')
        }))
      }
    }
    
    if (typeof data === 'object' && data !== null && 'cards' in data && Array.isArray((data as Record<string, unknown>).cards)) {
      const d = data as Record<string, unknown>
      return {
        name: String(d.name || d.title || 'Imported Deck'),
        cards: (d.cards as Record<string, unknown>[]).map((item) => ({
          front: String(item.en || item.front || item.question || ''),
          back: String(item.pt || item.back || item.answer || '')
        }))
      }
    }
    
    return null
  } catch {
    return null
  }
}

import JSZip from 'jszip'

export interface AnkiNote {
  id: number
  fields: string[]
  tags: string
  sfld: string
}

export interface AnkiDeck {
  id: number
  name: string
  desc: string
}

export interface ParsedApkg {
  deckName: string
  description: string
  cards: {
    front: string
    back: string
    tags: string[]
  }[]
}

// Simplified APKG parser - extracts text from Anki format
export async function parseApkg(file: File): Promise<ParsedApkg> {
  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)
  
  // Try to find the collection database
  const collectionFile = zip.file('collection.anki2') || zip.file('collection.anki21')
  
  if (!collectionFile) {
    throw new Error('Invalid APKG file: collection database not found')
  }
  
  // Read the database as binary
  const dbBuffer = await collectionFile.async('nodebuffer')
  
  // Parse SQLite header to get basic info
  const header = parseSQLiteHeader(dbBuffer)
  
  if (!header.valid) {
    throw new Error('Invalid SQLite database format')
  }
  
  // Extract text content from the binary (simplified approach)
  // In a full implementation, we'd use a proper SQLite parser
  const textContent = extractTextFromDb(dbBuffer)
  
  // Parse extracted text to find cards
  const cards = parseCardsFromText(textContent)
  
  // Get deck name from the file or use default
  const deckName = file.name.replace('.apkg', '')
  
  return {
    deckName,
    description: `Imported from ${file.name}`,
    cards
  }
}

function parseSQLiteHeader(buffer: Buffer): { magic: string; valid: boolean } {
  // SQLite file format header
  const header = buffer.slice(0, 100)
  const magic = header.slice(0, 16).toString('hex')
  
  return {
    magic,
    valid: magic.startsWith('53514c69746520666f726d61742033') // "SQLite format 3"
  }
}

function extractTextFromDb(buffer: Buffer): string {
  // Extract readable text from the binary
  // This is a simplified approach for demonstration
  let text = ''
  
  // Look for text patterns in the binary
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i]
    // Printable ASCII range
    if (byte >= 32 && byte <= 126) {
      text += String.fromCharCode(byte)
    } else if (byte === 0) {
      text += '\n'
    }
  }
  
  return text
}

function parseCardsFromText(text: string): { front: string; back: string; tags: string[] }[] {
  const cards: { front: string; back: string; tags: string[] }[] = []
  
  // Split by null characters which often separate records
  const parts = text.split('\u0000').filter(p => p.trim().length > 0)
  
  // Look for patterns that might be flashcard content
  // This is heuristic-based and may need adjustment
  for (let i = 0; i < parts.length - 1; i++) {
    const front = parts[i].trim()
    const back = parts[i + 1].trim()
    
    // Filter out very short strings and obvious non-content
    if (front.length > 2 && back.length > 2 && 
        front.length < 500 && back.length < 500 &&
        !front.includes('\n') && !back.includes('\n')) {
      cards.push({
        front,
        back,
        tags: []
      })
    }
  }
  
  return cards
}

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

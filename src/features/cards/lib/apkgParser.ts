import JSZip from 'jszip'
import initSqlJs from 'sql.js/dist/sql-asm.js'
import type { SqlJsStatic } from 'sql.js'

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

let sqlRuntime: Promise<SqlJsStatic> | undefined

function getSqlRuntime() {
  return sqlRuntime ??= initSqlJs().catch(error => {
    sqlRuntime = undefined
    throw error
  })
}

export async function parseApkg(file: File): Promise<ParsedApkg> {
  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)
  const collectionFile = zip.file('collection.anki2') || zip.file('collection.anki21')
  if (!collectionFile) {
    throw new Error('Invalid APKG file: collection database not found')
  }
  const dbBuffer = await collectionFile.async('uint8array')
  const header = parseSQLiteHeader(dbBuffer)
  if (!header.valid) {
    throw new Error('Invalid SQLite database format')
  }
  const SQL = await getSqlRuntime()
  const db = new SQL.Database(dbBuffer)
  try {
    const cards = getCards(db)
    const deckName = getDeckName(db) || file.name.replace(/\.apkg$/i, '')
    const description = getDeckDescription(db, deckName) || `Imported from ${file.name}`
    return { deckName, description, cards }
  } finally {
    db.close()
  }
}

function parseSQLiteHeader(buffer: Uint8Array): { magic: string; valid: boolean } {
  const header = buffer.slice(0, 100)
  const magic = Array.from(header.slice(0, 16))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
  return {
    magic,
    valid: magic.startsWith('53514c69746520666f726d61742033')
  }
}
type DB = { exec: (q: string) => { columns: string[]; values: unknown[][] }[] }
function q(db: DB, sql: string) {
  const r = db.exec(sql)?.[0]
  if (!r) return []
  return r.values.map(v => Object.fromEntries(r.columns.map((c, i) => [c, v[i]])) as Record<string, unknown>)
}
function h(t: string) {
  return t
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}
function getCards(db: DB): { front: string; back: string; tags: string[] }[] {
  const rows = q(db, `SELECT n.flds as flds,n.tags as tags FROM notes n`)
  const o: { front: string; back: string; tags: string[] }[] = []
  const seen = new Set<string>()
  for (const r of rows) {
    const f = String(r.flds || '').split('\u001f')
    if (f.length < 2) continue
    const front = h(f[0] || '')
    const back = h(f[1] || '')
    if (!front || !back) continue
    const k = `${front}\u0001${back}`
    if (seen.has(k)) continue
    seen.add(k)
    const tags = String(r.tags || '').trim().split(/\s+/).filter(Boolean)
    o.push({ front, back, tags })
  }
  if (!o.length) throw new Error('APKG sem cards válidos')
  return o
}
function j(v: unknown): Record<string, unknown> {
  if (typeof v !== 'string') return {}
  try { return JSON.parse(v) as Record<string, unknown> } catch { return {} }
}
function getDeckMap(db: DB) {
  const c = q(db, `SELECT decks FROM col LIMIT 1`)?.[0]
  return j(c?.decks)
}
function getDeckName(db: DB) {
  const m = getDeckMap(db)
  const d = Object.values(m).find(x => typeof x === 'object' && x && String((x as Record<string, unknown>).name || '').trim())
  if (!d) return ''
  return String((d as Record<string, unknown>).name || '').trim()
}
function getDeckDescription(db: DB, n: string) {
  const m = getDeckMap(db)
  const v = Object.values(m).find(x => typeof x === 'object' && x && String((x as Record<string, unknown>).name || '') === n) as Record<string, unknown> | undefined
  const d = String(v?.desc || '').trim()
  return d ? h(d) : ''
}

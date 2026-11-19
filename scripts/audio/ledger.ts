import { createHash } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { ELEVENLABS_MODEL, ELEVENLABS_VOICES, type AudioVoice } from '../../src/lib/audioRoles'

// Version 1 is the fixed en-US recording profile. Keep its hashes compatible
// with the original receipts; another language needs a new profile.
export function clipKey(text: string, voice: AudioVoice, language = 'en-US') {
  if (language !== 'en-US') throw Error('Idioma fora do perfil de voz.')
  return createHash('sha256')
    .update(
      JSON.stringify([
        1,
        ELEVENLABS_MODEL,
        ELEVENLABS_VOICES[voice],
        'mp3_44100_128',
        text.trim().normalize('NFC'),
      ]),
    )
    .digest('hex')
}

// Only the explicitly invoked offline publisher owns this database. Deployed readers
// share the versioned manifest and immutable media without contacting the paid API.
export function openLedger(path: string) {
  const db = new DatabaseSync(path)
  db.exec(`PRAGMA busy_timeout=10000;
    CREATE TABLE IF NOT EXISTS budget(id INTEGER PRIMARY KEY CHECK(id=1), ceiling INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS jobs(key TEXT PRIMARY KEY, reserved INTEGER NOT NULL, credits INTEGER, audio BLOB, requestId TEXT);`)
  return db
}

export function reserve(db: DatabaseSync, key: string, cost: number, ceiling: number) {
  if (!Number.isSafeInteger(cost) || cost < 1 || !Number.isSafeInteger(ceiling) || ceiling < 0 || ceiling > 20000)
    throw Error('Orçamento inválido')
  db.exec('BEGIN IMMEDIATE')
  try {
    db.prepare(
      'INSERT INTO budget VALUES(1,?) ON CONFLICT(id) DO UPDATE SET ceiling=min(ceiling,excluded.ceiling)',
    ).run(ceiling)
    if (db.prepare('SELECT 1 FROM jobs WHERE key=?').get(key)) return false
    const result = db
      .prepare(
        `INSERT INTO jobs(key,reserved) SELECT ?,? WHERE
      ? + (SELECT coalesce(sum(coalesce(credits,reserved)),0) FROM jobs) <= (SELECT ceiling FROM budget)
      AND NOT EXISTS(SELECT 1 FROM jobs WHERE credits IS NULL OR credits>reserved)`,
      )
      .run(key, cost, cost)
    if (!result.changes) throw Error('Limite atingido ou reserva em aberto. Reconcilie antes de continuar.')
    return true
  } finally {
    db.exec('COMMIT')
  }
}

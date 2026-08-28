/**
 * Gera e armazena o áudio dos cards que ainda não têm.
 *
 *   node --env-file=.env.local scripts/generate-audio.ts [--levels=A1,A2] [--limit=200] [--dry-run]
 *
 * Por que pré-gerar, se o `AudioButton` já sintetiza sob demanda: o fallback resolve a COBERTURA
 * (toda frase pode ser ouvida) mas não o CUSTO — cada play refaz a síntese, e o endpoint responde
 * `Cache-Control: no-cache`. Áudio no storage toca instantâneo, sobrevive offline no PWA e não
 * depende do serviço externo estar de pé no momento do estudo.
 *
 * Idempotente: só toca em card com `audio_url` nulo. Interromper e rodar de novo continua de onde
 * parou.
 */
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { readFile, unlink } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const nivelArg = args.find((a) => a.startsWith('--levels='))?.split('=')[1]
const limitArg = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? '0')
const NIVEIS = (nivelArg ? nivelArg.split(',') : ['A1', 'A2']).map((n) => n.trim().toUpperCase())

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Rode com: node --env-file=.env.local scripts/generate-audio.ts')
  process.exit(1)
}
const db = createClient(url, key)

/** Mesma voz padrão do app, para o áudio gravado e o sintetizado na hora soarem igual. */
const VOICE = 'en-US-EmmaMultilingualNeural'

function normalizar(level: string | null): string {
  if (!level) return 'A2'
  const u = level.trim().toUpperCase()
  for (const b of ['A1', 'A2', 'B1', 'B2']) if (u === b || u.includes(b)) return b
  if (u === 'C1' || u === 'C2') return 'B2'
  return 'A2'
}

async function lerTudo<T>(tabela: string, colunas: string): Promise<T[]> {
  const passo = 1000
  const todas: T[] = []
  for (let de = 0; ; de += passo) {
    const { data, error } = await db.from(tabela).select(colunas).range(de, de + passo - 1)
    if (error) throw error
    todas.push(...((data || []) as T[]))
    if (!data || data.length < passo) break
  }
  return todas
}

async function sintetizar(texto: string): Promise<Buffer> {
  const { EdgeTTS } = await import('node-edge-tts')
  const tmp = path.join(os.tmpdir(), `kivora-seed-tts-${randomUUID()}.mp3`)
  try {
    const tts = new EdgeTTS({ voice: VOICE })
    await tts.ttsPromise(texto, tmp)
    return await readFile(tmp)
  } finally {
    await unlink(tmp).catch(() => undefined)
  }
}

async function main() {
  const packs = new Map(
    (await lerTudo<{ id: string; level: string | null; is_public: boolean | null }>(
      'packs',
      'id,level,is_public'
    )).map((p) => [p.id, p])
  )
  const cards = await lerTudo<{
    id: string
    pack_id: string
    english_phrase: string
    audio_url: string | null
  }>('cards', 'id,pack_id,english_phrase,audio_url')

  let alvo = cards.filter((c) => {
    if (c.audio_url) return false
    const p = packs.get(c.pack_id)
    if (!p || p.is_public === false) return false
    return NIVEIS.includes(normalizar(p.level))
  })
  if (limitArg > 0) alvo = alvo.slice(0, limitArg)

  console.log(`níveis: ${NIVEIS.join(', ')} | cards sem áudio: ${alvo.length}`)
  if (dryRun || alvo.length === 0) return

  let ok = 0
  let falhou = 0
  for (const [i, card] of alvo.entries()) {
    try {
      const buffer = await sintetizar(card.english_phrase)
      const storagePath = `${card.id}/${randomUUID()}.mp3`
      const { data: up, error: upErr } = await db.storage
        .from('card_audios')
        .upload(storagePath, buffer, { contentType: 'audio/mpeg', upsert: true })
      if (upErr) throw upErr

      const {
        data: { publicUrl },
      } = db.storage.from('card_audios').getPublicUrl(up.path)

      const { error: updErr } = await db.from('cards').update({ audio_url: publicUrl }).eq('id', card.id)
      if (updErr) throw updErr

      ok++
    } catch (error) {
      falhou++
      console.error(`falhou [${card.id}] ${card.english_phrase}:`, error instanceof Error ? error.message : error)
    }
    if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${alvo.length} — ok ${ok}, falhas ${falhou}`)
  }

  console.log(`\nconcluído: ${ok} gerados, ${falhou} falhas`)
}

main().catch((error) => {
  console.error('Falha na geração de áudio:', error)
  process.exit(1)
})

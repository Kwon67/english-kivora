/** Attach already-published ElevenLabs clips to eligible public cards. */
import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'

const index:Record<string,string> = JSON.parse(await readFile(new URL('../src/lib/staticAudioIndex.json',import.meta.url),'utf8'))
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
    if (!p || p.is_public !== true) return false
    return NIVEIS.includes(normalizar(p.level))
  })
  if (limitArg > 0) alvo = alvo.slice(0, limitArg)

  console.log(`níveis: ${NIVEIS.join(', ')} | cards sem áudio: ${alvo.length}`)
  if (dryRun || alvo.length === 0) return

  let ok = 0
  let falhou = 0
  for (const [i, card] of alvo.entries()) {
    try {
      const hash=index['lauren:'+card.english_phrase.trim().normalize('NFC')]
      if (!hash) continue
      const audioUrl = '/audio/kivora/' + hash + '.mp3'
      const {error}=await db.from('cards').update({audio_url:audioUrl}).eq('id',card.id).eq('english_phrase',card.english_phrase).is('audio_url',null)
      if(error) throw error

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

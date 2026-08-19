import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { phraseSimilarity, normalizePhrase } from './src/features/ai/lib/phraseCoverage'

for (const raw of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const l = raw.trim()
  if (!l || l.startsWith('#') || !l.includes('=')) continue
  const k = l.slice(0, l.indexOf('=')).trim()
  let v = l.slice(l.indexOf('=') + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  process.env[k] = v
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

type Card = { id: string; english_phrase: string; portuguese_translation: string; pack_id: string; created_at: string }

async function main() {
  const { data: packs } = await db.from('packs').select('id,name,level,is_public')
  const pack = Object.fromEntries((packs ?? []).map((p) => [p.id, p]))

  const cards: Card[] = []
  for (let pg = 0; ; pg++) {
    const { data } = await db.from('cards').select('id,english_phrase,portuguese_translation,pack_id,created_at').range(pg * 1000, pg * 1000 + 999)
    cards.push(...((data ?? []) as Card[]))
    if ((data ?? []).length < 1000) break
  }

  // histórico por card
  const revs: Record<string, number> = {}
  for (let pg = 0; ; pg++) {
    const { data } = await db.from('card_reviews').select('card_id,total_reviews').range(pg * 1000, pg * 1000 + 999)
    for (const r of data ?? []) revs[r.card_id as string] = (r.total_reviews as number) ?? 0
    if ((data ?? []).length < 1000) break
  }

  const pares: { a: Card; b: Card; sim: number }[] = []
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const s = phraseSimilarity(cards[i].english_phrase, cards[j].english_phrase)
      if (s >= 0.8) pares.push({ a: cards[i], b: cards[j], sim: s })
    }
  }

  console.log(`${pares.length} pares\n`)
  pares.forEach((p, i) => {
    const exato = normalizePhrase(p.a.english_phrase) === normalizePhrase(p.b.english_phrase)
    console.log(`--- par ${i + 1} (${p.sim.toFixed(2)}${exato ? ', idênticas' : ', parecidas'}) ---`)
    for (const c of [p.a, p.b]) {
      const h = revs[c.id]
      console.log(`  "${c.english_phrase}"`)
      console.log(`     ${c.portuguese_translation}`)
      console.log(`     pack: ${pack[c.pack_id]?.name} [${pack[c.pack_id]?.level}] | histórico: ${h === undefined ? 'NENHUM' : `${h} revisões`}`)
    }
  })
}
main()

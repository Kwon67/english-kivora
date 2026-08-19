/**
 * Remoção de frases duplicadas do acervo.
 *
 * Regra: em cada par, sobrevive o card com MAIS histórico de revisão. Histórico é o aprendizado
 * em si e não pode ser recriado; a qual pack o card pertence é cosmético em comparação. Como
 * `card_reviews` tem ON DELETE CASCADE, apagar o card errado apaga junto o que a pessoa já sabe.
 *
 * Empate no histórico: fica o card mais antigo — nas coleções originais, curadas à mão.
 *
 * Simula por padrão; só apaga com --run, e sempre grava um backup antes.
 *
 *   npx tsx scripts/dedupe-cards.ts
 *   npx tsx scripts/dedupe-cards.ts --run
 */

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { phraseSimilarity } from '../src/features/ai/lib/phraseCoverage'

/**
 * Pares que o limiar acusa mas que NÃO são duplicata de verdade.
 *
 * Jaccard ignora a ordem das palavras, então "No, thank you, I'm fine" e "I'm fine, thank you"
 * batem em 0,80 com os mesmos tokens. São funções opostas: uma recusa uma oferta, a outra
 * responde "como vai". Apagar qualquer uma delas tira conteúdo legítimo.
 */
const NAO_SAO_DUPLICATA: [string, string][] = [
  ["No, thank you, I'm fine.", "I'm fine, thank you."],
]

const LIMIAR = 0.8

type Card = { id: string; english_phrase: string; portuguese_translation: string; pack_id: string; created_at: string }

function carregarEnv() {
  for (const raw of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const l = raw.trim()
    if (!l || l.startsWith('#') || !l.includes('=')) continue
    const k = l.slice(0, l.indexOf('=')).trim()
    let v = l.slice(l.indexOf('=') + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    process.env[k] = v
  }
}

function ehExcecao(a: string, b: string) {
  return NAO_SAO_DUPLICATA.some(
    ([x, y]) => (a === x && b === y) || (a === y && b === x)
  )
}

async function main() {
  carregarEnv()
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const aplicar = process.argv.includes('--run')

  const { data: packsData } = await db.from('packs').select('id,name,is_public')
  const nomePack = Object.fromEntries((packsData ?? []).map((p) => [p.id as string, p.name as string]))
  const packPublico = Object.fromEntries((packsData ?? []).map((p) => [p.id as string, p.is_public !== false]))

  const cards: Card[] = []
  for (let pg = 0; ; pg++) {
    const { data } = await db.from('cards').select('id,english_phrase,portuguese_translation,pack_id,created_at').range(pg * 1000, pg * 1000 + 999)
    cards.push(...((data ?? []) as Card[]))
    if ((data ?? []).length < 1000) break
  }

  const historico: Record<string, number> = {}
  for (let pg = 0; ; pg++) {
    const { data } = await db.from('card_reviews').select('card_id,total_reviews').range(pg * 1000, pg * 1000 + 999)
    for (const r of data ?? []) historico[r.card_id as string] = (r.total_reviews as number) ?? 0
    if ((data ?? []).length < 1000) break
  }

  const paraApagar = new Map<string, { card: Card; sobreviveu: Card }>()
  const mantidosPorExcecao: string[] = []

  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i]
      const b = cards[j]
      // Um card já condenado não decide o destino de outro.
      if (paraApagar.has(a.id) || paraApagar.has(b.id)) continue
      if (phraseSimilarity(a.english_phrase, b.english_phrase) < LIMIAR) continue

      if (ehExcecao(a.english_phrase, b.english_phrase)) {
        mantidosPorExcecao.push(`"${a.english_phrase}" / "${b.english_phrase}"`)
        continue
      }

      const ha = historico[a.id] ?? -1
      const hb = historico[b.id] ?? -1
      let fica = a
      let sai = b

      if (hb > ha) {
        fica = b
        sai = a
      } else if (hb === ha) {
        // Sem histórico para decidir, o pack público curado ganha do pack privado do Blitz,
        // que é efêmero e regerado pelo jogo — ficar com a cópia de lá seria guardar a versão
        // que some sozinha e apagar a que a pessoa realmente estuda.
        const pubA = packPublico[a.pack_id]
        const pubB = packPublico[b.pack_id]
        if (pubB && !pubA) {
          fica = b
          sai = a
        } else if (pubA === pubB && new Date(b.created_at) < new Date(a.created_at)) {
          fica = b
          sai = a
        }
      }
      paraApagar.set(sai.id, { card: sai, sobreviveu: fica })
    }
  }

  console.log(`${cards.length} frases | ${paraApagar.size} duplicata(s) a remover\n`)
  for (const { card, sobreviveu } of paraApagar.values()) {
    const hSai = historico[card.id] ?? 0
    const hFica = historico[sobreviveu.id] ?? 0
    console.log(`APAGA  "${card.english_phrase}"`)
    console.log(`         de "${nomePack[card.pack_id]}" (${hSai} revisões)`)
    console.log(`MANTÉM   em "${nomePack[sobreviveu.pack_id]}" (${hFica} revisões)`)
  }

  if (mantidosPorExcecao.length) {
    console.log(`\n${mantidosPorExcecao.length} par(es) mantidos de propósito (não são duplicata real):`)
    mantidosPorExcecao.forEach((p) => console.log(`  ${p}`))
  }

  const perdido = [...paraApagar.values()].reduce((s, x) => s + (historico[x.card.id] ?? 0), 0)
  const preservado = [...paraApagar.values()].reduce((s, x) => s + (historico[x.sobreviveu.id] ?? 0), 0)
  console.log(`\nrevisões descartadas: ${perdido} | preservadas nos sobreviventes: ${preservado}`)

  if (!aplicar) {
    console.log('\n(simulação — use --run para aplicar)')
    return
  }

  const backup = [...paraApagar.values()].map(({ card }) => ({
    ...card,
    pack: nomePack[card.pack_id],
    total_reviews: historico[card.id] ?? 0,
  }))
  const caminho = `supabase/cards-removidos-${new Date().toISOString().slice(0, 10)}.json`
  fs.writeFileSync(caminho, JSON.stringify(backup, null, 2))
  console.log(`\nbackup em ${caminho}`)

  const ids = [...paraApagar.keys()]
  for (let i = 0; i < ids.length; i += 50) {
    const { error } = await db.from('cards').delete().in('id', ids.slice(i, i + 50))
    if (error) {
      console.error('ERRO ao apagar:', error.message)
      process.exit(1)
    }
  }
  console.log(`${ids.length} frase(s) removida(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

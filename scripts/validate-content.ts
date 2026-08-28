import { createClient } from '@supabase/supabase-js'
import { A1_PACKS } from './content/a1.ts'
import { A2_PACKS } from './content/a2.ts'
import { B1_PACKS } from './content/b1.ts'
import { PRONUNCIA_PACKS } from './content/pronuncia.ts'
import { REFORCO_PACKS } from './content/reforco-a1a2.ts'

const todos = [...A1_PACKS, ...A2_PACKS, ...B1_PACKS, ...REFORCO_PACKS, ...PRONUNCIA_PACKS]
const porNivel: Record<string, { packs: number; cards: number }> = {}
const frases: string[] = []
for (const p of todos) {
  porNivel[p.level] ??= { packs: 0, cards: 0 }
  porNivel[p.level].packs++
  porNivel[p.level].cards += p.cards.length
  for (const [en] of p.cards) frases.push(en.trim().toLowerCase())
}

const contagem = new Map<string, number>()
for (const f of frases) contagem.set(f, (contagem.get(f) || 0) + 1)
const dupInternas = [...contagem.entries()].filter(([, n]) => n > 1)

const tamanhosErrados = todos.filter((p) => p.cards.length !== 12).map((p) => `${p.name} (${p.cards.length})`)

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const { data: existentes } = await db.from('cards').select('english_phrase')
const jaExiste = new Set((existentes || []).map((c) => String(c.english_phrase).trim().toLowerCase()))
const colisoes = [...new Set(frases)].filter((f) => jaExiste.has(f))


console.log(JSON.stringify({
  novos: porNivel,
  totalCardsNovos: frases.length,
  packsForaDe12: tamanhosErrados,
  duplicatasInternas: dupInternas.slice(0, 10),
  colisoesComBaseExistente: colisoes.slice(0, 15),
  totalColisoes: colisoes.length,
}, null, 2))

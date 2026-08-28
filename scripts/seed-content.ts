/**
 * Insere o conteúdo curado de `scripts/content/` no catálogo.
 *
 * Idempotente por construção: identifica pack por (nome + nível) e só insere cards em pack que
 * está vazio. Rodar duas vezes não duplica nada — o que importa aqui, porque a alternativa seria
 * um catálogo com 56 packs repetidos e nenhuma forma barata de desfazer.
 *
 * ATENÇÃO ao ler `packs`/`cards` em scripts como este: o PostgREST corta o `select` em 1000 linhas
 * por padrão. Uma auditoria minha sem paginação concluiu que 20 packs estavam vazios quando na
 * verdade os cards deles estavam além da linha 1000. Sempre pagine com `.range()` ou conte com
 * `{ count: 'exact', head: true }`.
 *
 *   node --env-file=.env.local scripts/seed-content.ts [--dry-run]
 *
 * `--dry-run` mostra o plano sem escrever. Use antes de rodar de verdade em produção.
 */
import { createClient } from '@supabase/supabase-js'
import { A1_PACKS } from './content/a1.ts'
import { A2_PACKS } from './content/a2.ts'
import { B1_PACKS } from './content/b1.ts'
import { PRONUNCIA_PACKS } from './content/pronuncia.ts'
import { REFORCO_PACKS } from './content/reforco-a1a2.ts'
import type { SeedPack } from './content/types.ts'

const dryRun = process.argv.includes('--dry-run')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY.')
  console.error('Rode com: node --env-file=.env.local scripts/seed-content.ts')
  process.exit(1)
}

const db = createClient(url, serviceKey)

const NOVOS: SeedPack[] = [...A1_PACKS, ...A2_PACKS, ...B1_PACKS, ...REFORCO_PACKS, ...PRONUNCIA_PACKS]

/** Chave de identidade de um pack no catálogo. Nome sozinho não basta: níveis diferentes podem
 *  legitimamente repetir um tema (ex.: "Roupas" em A1 e A2). */
const chave = (name: string, level: string | null) => `${name.trim().toLowerCase()}::${(level || '').toUpperCase()}`

/**
 * Lê uma tabela inteira, em páginas.
 *
 * O PostgREST devolve no máximo 1000 linhas por `select`, silenciosamente. Sem paginar, este
 * script lia só as primeiras 1000 linhas de `cards` e concluía que dezenas de packs estavam
 * vazios — o que, num script cuja única decisão é "este pack está vazio?", significa inserir
 * conteúdo duplicado em packs que já tinham. Foi exatamente o que aconteceu na primeira execução.
 */
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
  const packsExistentes = await lerTudo<{ id: string; name: string; level: string | null }>(
    'packs',
    'id,name,level,is_public'
  )
  const cardRows = await lerTudo<{ pack_id: string }>('cards', 'pack_id')

  const cardsPorPack = new Map<string, number>()
  for (const row of cardRows || []) {
    cardsPorPack.set(row.pack_id as string, (cardsPorPack.get(row.pack_id as string) || 0) + 1)
  }

  const porChave = new Map<string, { id: string; name: string }>()
  for (const p of packsExistentes || []) {
    porChave.set(chave(p.name as string, p.level as string | null), { id: p.id as string, name: p.name as string })
  }

  let packsCriados = 0
  let packsPulados = 0
  let cardsInseridos = 0
  let packsPreenchidos = 0
  const naoEncontrados: string[] = []

  // ---- 1. Packs novos (A1, A2, B1) -----------------------------------------
  for (const seed of NOVOS) {
    const existente = porChave.get(chave(seed.name, seed.level))

    if (existente) {
      // Pack já existe. Só completa se estiver vazio; nunca sobrescreve conteúdo do admin.
      if ((cardsPorPack.get(existente.id) || 0) > 0) {
        packsPulados++
        continue
      }
      if (!dryRun) {
        const { error } = await db.from('cards').insert(
          seed.cards.map(([en, pt]) => ({
            pack_id: existente.id,
            english_phrase: en,
            portuguese_translation: pt,
          }))
        )
        if (error) throw error
      }
      cardsInseridos += seed.cards.length
      packsPreenchidos++
      continue
    }

    if (dryRun) {
      packsCriados++
      cardsInseridos += seed.cards.length
      continue
    }

    const { data: novoPack, error: insErr } = await db
      .from('packs')
      .insert({
        name: seed.name,
        description: seed.description,
        level: seed.level,
        category: seed.category,
        is_public: true,
      })
      .select('id')
      .single()
    if (insErr) throw insErr

    const { error: cardsErr } = await db.from('cards').insert(
      seed.cards.map(([en, pt]) => ({
        pack_id: novoPack.id,
        english_phrase: en,
        portuguese_translation: pt,
      }))
    )
    if (cardsErr) throw cardsErr

    packsCriados++
    cardsInseridos += seed.cards.length
  }

  console.log(dryRun ? '\n=== SIMULAÇÃO (nada foi escrito) ===' : '\n=== SEED APLICADO ===')
  console.log(`packs criados:      ${packsCriados}`)
  console.log(`packs preenchidos:  ${packsPreenchidos}`)
  console.log(`packs pulados:      ${packsPulados} (já tinham conteúdo)`)
  console.log(`cards inseridos:    ${cardsInseridos}`)
  if (naoEncontrados.length) {
    console.log(`\nAVISO — packs do fill não encontrados pelo nome (${naoEncontrados.length}):`)
    for (const n of naoEncontrados) console.log(`  - ${n}`)
  }
}

main().catch((error) => {
  console.error('Falha no seed:', error)
  process.exit(1)
})

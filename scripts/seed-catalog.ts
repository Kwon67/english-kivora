/**
 * Semeadura do catálogo público.
 *
 * Percorre o plano em scripts/catalogPlan.ts, gera as frases que faltam para cada coleção e
 * grava no banco. Três garantias que a geração manual nunca teve:
 *
 *  - idempotente: coleção que já existe pelo nome é pulada, então rodar duas vezes não duplica;
 *  - sem repetição: cada lote é conferido contra o acervo inteiro antes de entrar;
 *  - sem áudio: o TTS nasce sozinho na primeira reprodução, então semear não gasta síntese.
 *
 * Começa em simulação. Só escreve com --run.
 *
 *   npx tsx scripts/seed-catalog.ts                 # mostra o plano, não toca em nada
 *   npx tsx scripts/seed-catalog.ts --run --limit 3 # cria as 3 primeiras de verdade
 *   npx tsx scripts/seed-catalog.ts --run           # cria todas as que faltam
 *   npx tsx scripts/seed-catalog.ts --run --model openai/gpt-oss-20b   # outro modelo, outra cota
 */

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { CATALOG_PLAN } from './catalogPlan'
import { generateFreshCards } from '../src/features/ai/lib/generateFreshCards'
import { selectRelevantPhrases } from '../src/features/ai/lib/phraseCoverage'

const CARDS_POR_COLECAO = 12

function carregarEnv() {
  for (const linhaBruta of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const linha = linhaBruta.trim()
    if (!linha || linha.startsWith('#') || !linha.includes('=')) continue
    const chave = linha.slice(0, linha.indexOf('=')).trim()
    let valor = linha.slice(linha.indexOf('=') + 1).trim()
    if ((valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"))) {
      valor = valor.slice(1, -1)
    }
    process.env[chave] = valor
  }
}

async function main() {
  carregarEnv()

  const args = process.argv.slice(2)
  const executar = args.includes('--run')
  const limiteArg = args.indexOf('--limit')
  const limite = limiteArg >= 0 ? Number(args[limiteArg + 1]) : Infinity
  const modeloArg = args.indexOf('--model')
  const modelo = modeloArg >= 0 ? args[modeloArg + 1] : undefined

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: packsExistentes } = await db.from('packs').select('id,name')
  const nomesExistentes = new Set((packsExistentes ?? []).map((p) => p.name))

  // Paginado: o PostgREST devolve no máximo 1000 linhas por requisição e ignora limites
  // maiores em silêncio. Sem isso a semeadura fica cega para o acervo além da milésima frase
  // e passa a gerar repetição achando que é material novo.
  const acervo: string[] = []
  for (let pagina = 0; ; pagina += 1) {
    const inicio = pagina * 1000
    const { data: lote } = await db
      .from('cards')
      .select('english_phrase')
      .range(inicio, inicio + 999)

    for (const card of lote ?? []) {
      if (card.english_phrase) acervo.push(card.english_phrase as string)
    }
    if ((lote ?? []).length < 1000) break
  }

  const pendentes = CATALOG_PLAN.filter((entrada) => !nomesExistentes.has(entrada.name))
  const alvo = pendentes.slice(0, limite)

  console.log(`acervo atual      : ${acervo.length} frases em ${nomesExistentes.size} coleções`)
  console.log(`plano             : ${CATALOG_PLAN.length} coleções`)
  console.log(`já existem        : ${CATALOG_PLAN.length - pendentes.length}`)
  console.log(`serão criadas     : ${alvo.length}${executar ? '' : '  (SIMULAÇÃO — use --run para valer)'}\n`)

  if (!executar) {
    for (const entrada of alvo) {
      console.log(`  [${entrada.level}] ${entrada.category.padEnd(12)} ${entrada.name}`)
    }

    // Projeção por nível: é o que diz se a semeadura corrige o formato da curva ou só
    // engorda o nível que já estava gordo.
    const { data: publicos } = await db.from('packs').select('id,level').eq('is_public', true)
    const atualPorNivel: Record<string, number> = {}
    for (const pack of publicos ?? []) {
      const { count } = await db.from('cards').select('id', { count: 'exact', head: true }).eq('pack_id', pack.id)
      const nivel = (pack.level as string) ?? '-'
      atualPorNivel[nivel] = (atualPorNivel[nivel] ?? 0) + (count ?? 0)
    }

    const acrescimo: Record<string, number> = {}
    for (const entrada of alvo) {
      acrescimo[entrada.level] = (acrescimo[entrada.level] ?? 0) + CARDS_POR_COLECAO
    }

    console.log('\nNÍVEL    hoje   +novas   depois')
    for (const nivel of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
      const hoje = atualPorNivel[nivel] ?? 0
      const mais = acrescimo[nivel] ?? 0
      console.log(`${nivel.padEnd(9)}${String(hoje).padStart(4)}   ${String(mais).padStart(6)}   ${String(hoje + mais).padStart(6)}`)
    }
    console.log(`\ntotal: ${acervo.length} -> ${acervo.length + alvo.length * CARDS_POR_COLECAO} frases`)
    return
  }

  let criadas = 0
  let frasesNovas = 0

  for (const entrada of alvo) {
    process.stdout.write(`[${entrada.level}] ${entrada.name} ... `)

    try {
      const proibidas = selectRelevantPhrases(entrada.topic, acervo, 60)
      const { cards, discarded } = await generateFreshCards({
        topic: entrada.topic,
        count: CARDS_POR_COLECAO,
        avoidPhrases: proibidas,
        level: entrada.level,
        ...(modelo ? { model: modelo } : {}),
      })

      if (cards.length === 0) {
        console.log('nenhuma frase inédita, pulando')
        continue
      }

      const { data: pack, error: erroPack } = await db
        .from('packs')
        .insert({
          name: entrada.name,
          description: entrada.description,
          level: entrada.level,
          category: entrada.category,
          is_public: true,
          owner_id: null,
        })
        .select('id')
        .single()

      if (erroPack || !pack) {
        console.log(`ERRO ao criar coleção: ${erroPack?.message}`)
        continue
      }

      const { error: erroCards } = await db.from('cards').insert(
        cards.map((card) => ({
          pack_id: pack.id,
          english_phrase: card.en,
          portuguese_translation: card.pt,
        }))
      )

      if (erroCards) {
        await db.from('packs').delete().eq('id', pack.id)
        console.log(`ERRO ao inserir frases, coleção removida: ${erroCards.message}`)
        continue
      }

      // O acervo cresce em memória para a próxima coleção já enxergar estas frases.
      acervo.push(...cards.map((card) => card.en))
      criadas += 1
      frasesNovas += cards.length
      console.log(`${cards.length} frases${discarded > 0 ? ` (${discarded} repetidas descartadas)` : ''}`)
    } catch (erro) {
      console.log(`FALHOU: ${erro instanceof Error ? erro.message : String(erro)}`)
    }
  }

  console.log(`\n${criadas} coleções criadas, ${frasesNovas} frases novas.`)
  console.log(`acervo agora: ${acervo.length} frases.`)
}

main().catch((erro) => {
  console.error(erro)
  process.exit(1)
})

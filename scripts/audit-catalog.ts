/**
 * Auditoria de qualidade do acervo.
 *
 * Existe porque a inspeção a olho nu não pegou o pior defeito que o catálogo já teve: a coleção
 * de expressões idiomáticas com 67% das frases em condicional, porque o prompt listava as
 * estruturas do nível B2 e o modelo entendeu como checklist. Cada frase parecia aceitável
 * sozinha; só a contagem mostrou o padrão.
 *
 *   npx tsx scripts/audit-catalog.ts
 */

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { phraseSimilarity } from '../src/features/ai/lib/phraseCoverage'

/** Acima disso, a estrutura virou molde e não escolha. */
const LIMITE_ESTRUTURA = 0.5

const CONDICIONAL = /\b(if|should|were to|would have|had been)\b/i

/**
 * "if" de pergunta indireta não é condicional.
 *
 * "I was wondering if you could help" tem a mesma palavra que "If it rains, we stay", mas é uma
 * pergunta embutida — e é justamente o conteúdo da coleção "Pedidos indiretos", que o auditor
 * acusava de 58% de condicional enquanto estava perfeita.
 */
const IF_DE_PERGUNTA = /\b(wondering|know|tell me|find out|see|ask|check|wonder)\b[^.?!]{0,25}\bif\b/i
const PASSIVA = /\b(was|were|been|is|are)\s+\w+(ed|en)\b/i

/**
 * Faixa de palavras por nível — e por que o piso some no topo.
 *
 * De A1 a B2 a dificuldade cresce com a estrutura da frase, então comprimento serve de proxy
 * razoável e um piso pega material calibrado abaixo do rótulo. Em C1 e C2 isso deixa de valer:
 * a dificuldade passa a ser lexical e pragmática, e a frase ENCURTA enquanto fica mais difícil.
 * "He's a loose cannon" tem cinco palavras e é C2 puro; uma coleção que contrasta registro
 * ("We must submit the report" contra "We gotta finish it") é curta de propósito. Piso nesses
 * níveis reprova conteúdo certo, então só o teto continua valendo.
 */
const FAIXA_POR_NIVEL: Record<string, [number, number]> = {
  A1: [0, 8],
  A2: [4, 11],
  B1: [7, 15],
  B2: [9, 19],
  C1: [0, 24],
  C2: [0, 26],
}

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

async function main() {
  carregarEnv()
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: packs } = await db.from('packs').select('id,name,level,category').eq('is_public', true)
  const problemas: string[] = []
  const todasFrases: string[] = []
  const porNivel: Record<string, number[]> = {}

  for (const pack of packs ?? []) {
    const { data: cards } = await db.from('cards').select('english_phrase').eq('pack_id', pack.id)
    if (!cards?.length) {
      problemas.push(`VAZIA        ${pack.name}`)
      continue
    }

    const frases = cards.map((c) => c.english_phrase as string)
    todasFrases.push(...frases)

    const nivel = (pack.level as string) ?? '-'
    const condicional =
      frases.filter((f) => CONDICIONAL.test(f) && !IF_DE_PERGUNTA.test(f)).length / frases.length
    const passiva = frases.filter((f) => PASSIVA.test(f)).length / frases.length

    // Coleções cujo tema É a estrutura têm licença para concentrá-la.
    const temaEhEstrutura = /condicion|passiv|reportad|inver/i.test(pack.name)

    if (!temaEhEstrutura && condicional > LIMITE_ESTRUTURA) {
      problemas.push(`CONDICIONAL  ${pack.name} — ${Math.round(condicional * 100)}% das frases`)
    }
    if (!temaEhEstrutura && passiva > LIMITE_ESTRUTURA) {
      problemas.push(`PASSIVA      ${pack.name} — ${Math.round(passiva * 100)}% das frases`)
    }

    const faixa = FAIXA_POR_NIVEL[nivel]
    if (faixa) {
      const media = frases.reduce((s, f) => s + f.split(' ').length, 0) / frases.length
      porNivel[nivel] ??= []
      porNivel[nivel].push(media)
      if (media < faixa[0] || media > faixa[1]) {
        problemas.push(`NÍVEL        ${pack.name} [${nivel}] — média ${media.toFixed(1)} palavras, esperado ${faixa[0]}–${faixa[1]}`)
      }
    }
  }

  let duplicatas = 0
  for (let i = 0; i < todasFrases.length; i++) {
    for (let j = i + 1; j < todasFrases.length; j++) {
      if (phraseSimilarity(todasFrases[i], todasFrases[j]) >= 0.8) duplicatas += 1
    }
  }

  const exoticos = new Set<string>()
  for (const frase of todasFrases) {
    for (const ch of frase) {
      const cp = ch.codePointAt(0)!
      if (cp > 127 && !/[À-ÿ]/.test(ch)) exoticos.add(`U+${cp.toString(16).toUpperCase()}`)
    }
  }

  console.log(`${packs?.length ?? 0} coleções, ${todasFrases.length} frases\n`)
  console.log('comprimento médio por nível:')
  for (const n of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
    if (!porNivel[n]) continue
    const m = porNivel[n].reduce((a, b) => a + b, 0) / porNivel[n].length
    console.log(`  ${n}: ${m.toFixed(1)} palavras`)
  }
  console.log(`\npares duplicados : ${duplicatas}`)
  console.log(`caracteres exóticos: ${exoticos.size ? [...exoticos].join(' ') : 'nenhum'}`)
  console.log(`\n${problemas.length ? `${problemas.length} problema(s):` : 'nenhum problema encontrado.'}`)
  problemas.forEach((p) => console.log(`  ${p}`))
}

main().catch((erro) => {
  console.error(erro)
  process.exit(1)
})

/**
 * Auditoria de RLS por comportamento.
 *
 * Não há CLI nem string de conexão aqui, então `pg_policies` está fora de alcance. Em vez de
 * conferir a política no papel, esta auditoria faz o que um atacante faria: usa a chave anônima,
 * que é pública e viaja no bundle do site, e mede o que ela consegue.
 *
 * A parte difícil é LER o resultado, e a primeira versão deste script errou nisso. Duas
 * armadilhas do PostgREST, ambas capazes de produzir alarme falso:
 *
 *  - SELECT sob RLS não dá erro, ele FILTRA. Voltar sem erro e com zero linhas é a política
 *    funcionando, não falhando. Por isso aqui a leitura é comparada com a contagem real obtida
 *    pela service role: só é exposição se o anônimo vê linhas que existem.
 *  - DELETE sob RLS também não dá erro: devolve 200 tendo afetado zero linhas. Contar as linhas
 *    afetadas é o que separa "bloqueado" de "apagou".
 *
 *   npx tsx scripts/audit-rls.ts
 */

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

/** Tabelas cuja leitura pública é intencional (catálogo de conquistas exibido a visitantes). */
const LEITURA_PUBLICA_ESPERADA = new Set<string>(['badges'])

/** 42703 = coluna inexistente: o teste nem chegou na RLS, então não conclui nada. */
const CODIGO_COLUNA_INEXISTENTE = '42703'

type Linha = {
  tabela: string
  reais: number
  anonimoLe: number | null
  leituraErro: string | null
  escrita: string
  remocao: string
}

function main() {
  for (const raw of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const l = raw.trim()
    if (!l || l.startsWith('#') || !l.includes('=')) continue
    const k = l.slice(0, l.indexOf('=')).trim()
    let v = l.slice(l.indexOf('=') + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    process.env[k] = v
  }
  return auditar()
}

async function auditar() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const servico = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const tabelas = fs
    .readFileSync('scripts/rls-tables.txt', 'utf8')
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)

  const linhas: Linha[] = []

  for (const tabela of tabelas) {
    const { count: reais } = await servico.from(tabela).select('*', { count: 'exact', head: true })
    const leitura = await anon.from(tabela).select('*').limit(50)
    const escrita = await anon.from(tabela).insert({}).select()
    const remocao = await anon
      .from(tabela)
      .delete({ count: 'exact' })
      .eq('id', '00000000-0000-0000-0000-000000000000')

    linhas.push({
      tabela,
      reais: reais ?? 0,
      anonimoLe: leitura.error ? null : (leitura.data ?? []).length,
      leituraErro: leitura.error ? (leitura.error.code ?? 'erro') : null,
      escrita: escrita.error ? 'bloqueada' : 'ACEITA',
      remocao:
        remocao.error?.code === CODIGO_COLUNA_INEXISTENTE
          ? 'sem coluna id'
          : remocao.error
            ? 'bloqueada'
            : `${remocao.count ?? 0} linha(s) afetada(s)`,
    })
  }

  console.log('ANÔNIMO — chave pública, a mesma que vai no bundle do site\n')
  console.log('TABELA                        REAIS   ANÔNIMO LÊ   ESCRITA     REMOÇÃO')
  for (const l of linhas) {
    const le = l.leituraErro ? `erro ${l.leituraErro}` : `${l.anonimoLe}`
    console.log(
      `${l.tabela.padEnd(29)} ${String(l.reais).padStart(5)}   ${le.padEnd(12)} ${l.escrita.padEnd(11)} ${l.remocao}`
    )
  }

  const expostas = linhas.filter(
    (l) => !LEITURA_PUBLICA_ESPERADA.has(l.tabela) && (l.anonimoLe ?? 0) > 0
  )
  const escrevíveis = linhas.filter((l) => l.escrita === 'ACEITA')
  const apagáveis = linhas.filter((l) => /^[1-9]/.test(l.remocao))

  console.log('')
  console.log(`leitura exposta : ${expostas.length ? expostas.map((l) => l.tabela).join(', ') : 'nenhuma'}`)
  console.log(`escrita aberta  : ${escrevíveis.length ? escrevíveis.map((l) => l.tabela).join(', ') : 'nenhuma'}`)
  console.log(`remoção aberta  : ${apagáveis.length ? apagáveis.map((l) => l.tabela).join(', ') : 'nenhuma'}`)
  console.log(
    '\nNota: "0 linha(s) afetada(s)" na remoção significa bloqueado — o alvo era um id inexistente.\n' +
      'Para provar que a RLS barra a remoção de uma linha REAL, crie uma linha descartável pela\n' +
      'service role e tente apagá-la pelo anônimo; foi assim que badges foi verificada à mão.'
  )
}

main()

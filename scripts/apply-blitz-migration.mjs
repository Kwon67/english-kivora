#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260619120000_remove_arena_add_blitz.sql'
)

const sql = readFileSync(migrationPath, 'utf8')

if (process.env.DATABASE_URL) {
  const result = spawnSync('psql', [process.env.DATABASE_URL, '-v', 'ON_ERROR_STOP=1', '-f', migrationPath], {
    stdio: 'inherit',
    env: process.env,
  })

  if (result.status === 0) {
    console.log('Migration blitz_runs aplicada com sucesso via DATABASE_URL.')
    process.exit(0)
  }

  console.error('Falha ao aplicar migration via psql.')
  process.exit(result.status ?? 1)
}

console.log('DATABASE_URL não definida.')
console.log('')
console.log('Opção A — Supabase CLI (projeto linkado):')
console.log('  npx supabase login')
console.log('  npx supabase link --project-ref odnsaeyrvhbpjtqkvzff')
console.log('  npx supabase db push')
console.log('')
console.log('Opção B — SQL Editor do Supabase:')
console.log('  Cole o conteúdo de:')
console.log(`  ${migrationPath}`)
console.log('')
console.log('SQL da migration:')
console.log('---')
console.log(sql)
console.log('---')
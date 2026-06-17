#!/usr/bin/env node
/**
 * Color consistency audit — exits 1 if violations found.
 * Run: npm run audit:colors
 */
import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const srcDir = join(root, 'src')

const ALLOWED_HEX_FILES = new Set([
  'src/lib/brandColors.ts',
  'src/app/globals.css',
])

const FORBIDDEN_BRAND_HEX = /#(?:183b16|24551d|b8ff5c|cbff83|065f46|1db954|e3ecc2|eef3d6)/i

const CHECKS = [
  {
    id: 'forbidden-brand-hex',
    test: (text, file) => {
      if (ALLOWED_HEX_FILES.has(file)) return []
      const hits = []
      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (/<path\s+d=/.test(line)) continue
        if (FORBIDDEN_BRAND_HEX.test(line)) {
          hits.push({ line: i + 1, detail: line.trim().slice(0, 120) })
        }
      }
      return hits
    },
  },
  {
    id: 'emerald-primary-collision',
    test: (text) => {
      const hits = []
      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (/emerald-/.test(line) && /\b(?:bg-|text-|border-|ring-)primary/.test(line)) {
          hits.push({ line: i + 1, detail: line.trim().slice(0, 140) })
        }
      }
      return hits
    },
  },
  {
    id: 'duplicate-bg-utility',
    test: (text) => {
      const hits = []
      const re = /className=\{?[`'"]([^`'"]*)[`'"]\}?/g
      let m
      while ((m = re.exec(text))) {
        const tokens = m[1]
          .split(/\s+/)
          .filter((t) => /^bg-/.test(t) && !t.startsWith('dark:') && !t.startsWith('bg-gradient'))
        const seen = new Set()
        for (const t of tokens) {
          if (seen.has(t)) hits.push({ line: lineOf(text, m.index), detail: `duplicate ${t}` })
          seen.add(t)
        }
        const bare = tokens.filter((t) => !t.includes('[') && !t.includes('/'))
        if (bare.length >= 2) {
          hits.push({ line: lineOf(text, m.index), detail: `multiple bg: ${bare.join(', ')}` })
        }
      }
      return hits
    },
  },
  {
    id: 'light-tint-collision',
    test: (text) => {
      const hits = []
      const re = /className=\{?[`'"]([^`'"]*)[`'"]\}?/g
      let m
      while ((m = re.exec(text))) {
        const cls = m[1]
        const bareLight = /(?:^|\s)bg-primary-light\b/.test(cls)
        const barePrimaryOpacity = /(?:^|\s)bg-primary\/\d+/.test(cls)
        if (bareLight && barePrimaryOpacity && !/(?:^|\s)dark:bg-primary\//.test(cls)) {
          hits.push({ line: lineOf(text, m.index), detail: 'bg-primary-light + bg-primary/N without dark:' })
        }
      }
      return hits
    },
  },
  {
    id: 'legacy-spotify-green',
    test: (text, file) => {
      if (file.endsWith('.svg')) return []
      const hits = []
      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (/<path\s+d=/.test(line)) continue
        if (/#1[Dd][Bb]954|#065[Ff]46/.test(line)) {
          hits.push({ line: i + 1, detail: line.trim().slice(0, 120) })
        }
      }
      return hits
    },
  },
]

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length
}

const files = globSync(join(srcDir, '**/*.{ts,tsx}'), { exclude: (p) => p.includes('node_modules') })

let total = 0
const report = []

for (const abs of files) {
  const rel = relative(root, abs)
  const text = readFileSync(abs, 'utf8')

  for (const check of CHECKS) {
    const hits = check.test(text, rel)
    for (const hit of hits) {
      total++
      report.push({ file: rel, check: check.id, ...hit })
    }
  }
}

if (report.length === 0) {
  console.log('audit:colors — OK (0 violations)')
  process.exit(0)
}

console.log(`audit:colors — ${total} violation(s):\n`)
for (const row of report) {
  console.log(`  [${row.check}] ${row.file}:${row.line}`)
  console.log(`    ${row.detail}\n`)
}
process.exit(1)
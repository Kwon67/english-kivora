#!/usr/bin/env node
/**
 * Detects light-mode text invisible on solid bg-primary:
 * - text-primary (or inline --color-primary) inside solid bg-primary containers
 * - conflicting light-mode text color utilities on the same element
 *
 * Run: npm run audit:contrast
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const srcDir = join(import.meta.dirname, '..', 'src')
const CONTAINER_OPEN = /<(?:div|section|article|header|footer|main|aside|button|a|Link)\b/

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory() && entry.name !== 'node_modules') walk(path, out)
    else if (/\.tsx$/.test(entry.name)) out.push(path)
  }
  return out
}

function extractClassNames(line) {
  const matches = []
  const re = /className=(?:\{\s*[`'"]([^`'"]*)[`'"]\s*\}|"([^"]*)"|'([^']*)')/g
  let m
  while ((m = re.exec(line))) {
    matches.push(m[1] || m[2] || m[3])
  }
  return matches.join(' ')
}

function hasSolidBgPrimary(className) {
  return /(?:^|\s)bg-primary(?:\s|$)/.test(className) && !/bg-primary[-/]/.test(className.replace(/bg-primary-dark/g, ''))
}

function hasOwnSurface(className) {
  return /(?:^|\s)bg-(?:primary[-/]|hero-lime|card|surface|white|\[)/.test(className)
}

function isAllowedOnPrimaryText(className) {
  if (/\btext-on-primary\b/.test(className)) return true
  if (/\btext-hero-lime\b/.test(className) && !/(?:^|\s)(?<!dark:)text-primary/.test(className)) return true
  if (/\btext-white\b/.test(className)) return true
  return false
}

function hasInvisibleTextRisk(line, className) {
  if (isAllowedOnPrimaryText(className)) return false
  if (/(?:^|\s)(?<!dark:)text-primary/.test(className)) return true
  if (/style=\{\{[^}]*color:\s*['"]var\(--color-primary\)['"]/.test(line)) return true
  return false
}

function hasConflictingLightTextColors(className) {
  const lightTokens = (className.match(/(?:^|\s)(?<!dark:)text-(?:primary|hero-lime|on-primary|text(?:-muted|-subtle)?|(?:\[#[^\]]+\]))/g) || [])
  const hasPrimary = lightTokens.some((token) => /\btext-primary\b/.test(token))
  const hasOther = lightTokens.some((token) => !/\btext-primary\b/.test(token))
  return hasPrimary && hasOther
}

function hasSameElementCollision(className) {
  return hasSolidBgPrimary(className) && /(?:^|\s)(?<!dark:)text-primary/.test(className) && !/\btext-on-primary\b/.test(className)
}

const issues = []

for (const file of walk(srcDir)) {
  const rel = file.replace(srcDir + '/', 'src/')
  const lines = readFileSync(file, 'utf8').split('\n')
  const bgPrimaryStack = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const className = extractClassNames(line)

    if (className && hasSolidBgPrimary(className) && CONTAINER_OPEN.test(line)) {
      bgPrimaryStack.push({ line: i + 1 })
    }

    if (className && hasSameElementCollision(className)) {
      issues.push({
        id: 'same-element-primary-on-primary',
        file: rel,
        line: i + 1,
        detail: line.trim().slice(0, 160),
      })
    }

    if (bgPrimaryStack.length > 0 && className && hasInvisibleTextRisk(line, className) && !hasOwnSurface(className)) {
      const parent = bgPrimaryStack[bgPrimaryStack.length - 1]
      issues.push({
        id: 'invisible-on-solid-primary',
        file: rel,
        line: i + 1,
        parentLine: parent.line,
        detail: line.trim().slice(0, 160),
      })
    }

    if (className && hasConflictingLightTextColors(className)) {
      issues.push({
        id: 'conflicting-light-text-colors',
        file: rel,
        line: i + 1,
        detail: line.trim().slice(0, 160),
      })
    }

    const closes = (line.match(/<\/[A-Za-z][^>]*>/g) || []).length
    for (let c = 0; c < closes && bgPrimaryStack.length > 0; c++) {
      bgPrimaryStack.pop()
    }
  }
}

if (issues.length === 0) {
  console.log('No contrast issues found.')
  process.exit(0)
}

console.log(`Found ${issues.length} contrast issue(s):\n`)
for (const issue of issues) {
  console.log(`[${issue.id}] ${issue.file}:${issue.line}${issue.parentLine ? ` (solid bg-primary parent at line ${issue.parentLine})` : ''}`)
  console.log(`  ${issue.detail}\n`)
}
process.exit(1)
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

function applyEnvFile(path: string) {
  if (!existsSync(path)) return

  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue

    const key = trimmed.slice(0, idx).trim()
    const rawValue = trimmed.slice(idx + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '')

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

export function loadLocalEnv() {
  const root = process.cwd()
  applyEnvFile(resolve(root, '.env'))
  applyEnvFile(resolve(root, '.env.local'))
  applyEnvFile(resolve(root, '.env.e2e'))
}
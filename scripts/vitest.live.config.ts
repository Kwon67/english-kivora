import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: { alias: { '@': resolve(process.cwd(), 'src') } },
  test: { include: ['scripts/smoke-adaptive*.integration.ts'], testTimeout: 240_000 },
})

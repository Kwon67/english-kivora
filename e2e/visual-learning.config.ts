import { defineConfig } from '@playwright/test'

// Public UI and optional isolated fixtures only. Never runs the auth global setup.
export default defineConfig({
  testDir: '.',
  testMatch: 'visual-learning.spec.ts',
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  outputDir: process.env.KIVORA_AUDIT_DIR || '../output/visual-learning',
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3127',
    channel: 'chrome',
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
})

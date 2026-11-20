import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: 'landing.spec.ts',
  snapshotPathTemplate: '{testDir}/baseline/{arg}{ext}',
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100',
    browserName: 'chromium',
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
    locale: 'pt-BR',
  },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' } },
})

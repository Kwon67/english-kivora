import { defineConfig } from '@playwright/test'

// Public UI + an explicitly supplied, isolated fixture app. No global auth setup.
export default defineConfig({
  testDir: '.',
  testMatch: ['landing-premium.spec.ts', 'ui-refinement-fixtures.spec.ts'],
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: '../output/premium-refinement/browser-results.json' }]],
  outputDir: '../output/premium-refinement/browser-artifacts',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    launchOptions: { executablePath: process.env.KIVORA_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
})

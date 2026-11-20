import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: 'landing-scroll.spec.ts',
  workers: 1,
  outputDir: '../output/landing-hz/playwright',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 },
      launchOptions: { executablePath: process.env.KIVORA_CHROME_EXECUTABLE } } },
    { name: 'touch', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
  ],
})

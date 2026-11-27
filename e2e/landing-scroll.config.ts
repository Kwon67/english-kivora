import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: ['landing-scroll.spec.ts', 'landing-hero.spec.ts', 'landing-responsive.spec.ts', 'landing-premium.spec.ts', 'landing-polish.spec.ts'],
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
    { name: 'webkit-desktop', use: { browserName: 'webkit', viewport: { width: 1440, height: 900 } } },
    { name: 'touch', use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, browserName: 'webkit' } },
    { name: 'chromium-touch', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, browserName: 'chromium',
      launchOptions: { executablePath: process.env.KIVORA_CHROME_EXECUTABLE } } },
  ],
})

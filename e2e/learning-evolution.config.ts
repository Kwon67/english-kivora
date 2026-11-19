import { defineConfig, devices } from '@playwright/test'
const baseURL = process.env.KIVORA_LEARNING_FIXTURE_URL || 'http://127.0.0.1:3210'
if (!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) throw new Error('Only isolated localhost fixtures are allowed')
export default defineConfig({
  testDir: '.', testMatch: ['learning-evolution.spec.ts', 'learning-global.spec.ts', 'learning-readiness.spec.ts', 'learning-workflows.spec.ts'], workers: 1,
  outputDir: '../output/learning-evolution/browser-artifacts',
  reporter: [['list'], ['json', { outputFile: '../output/learning-evolution/browser-results.json' }]],
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 }, browserName: 'chromium', launchOptions: process.env.KIVORA_CHROME_EXECUTABLE ? { executablePath: process.env.KIVORA_CHROME_EXECUTABLE } : {} } },
    { name: 'mobile-chromium', use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, defaultBrowserType: 'chromium', browserName: 'chromium', launchOptions: process.env.KIVORA_CHROME_EXECUTABLE ? { executablePath: process.env.KIVORA_CHROME_EXECUTABLE } : {} } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
  ],
})

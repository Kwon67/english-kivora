import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: ['iphone-lan.spec.ts'],
  workers: 1,
  reporter: [['list'], ['json', { outputFile: '../output/iphone-fix/browser-results.json' }]],
  outputDir: '../output/iphone-fix/browser-artifacts',
  use: {
    baseURL: process.env.KIVORA_LAN_URL || 'http://192.168.101.142:3000',
    screenshot: 'only-on-failure',
    // No traces: auth tests use synthetic inputs and must not retain request bodies.
    trace: 'off',
  },
  projects: [
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
    { name: 'mobile-chromium', use: { ...devices['iPhone 13'], browserName: 'chromium', launchOptions: { executablePath: process.env.KIVORA_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' } } },
  ],
})

import { defineConfig, devices } from '@playwright/test'
const fixtureURL = process.env.KIVORA_FIXTURE_URL || 'http://192.168.101.142:3100'
if (!['127.0.0.1', 'localhost', '192.168.101.142'].includes(new URL(fixtureURL).hostname)) throw new Error('Use the isolated local fixture server')
export default defineConfig({
  testDir: '.', testMatch: ['learner-flow.spec.ts'], workers: 1,
  reporter: [['list'], ['json', { outputFile: '../output/learner-flow/browser-results.json' }]],
  outputDir: '../output/learner-flow/browser-artifacts',
  use: { baseURL: fixtureURL, trace: 'off', screenshot: 'only-on-failure' },
  projects: [
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
    { name: 'desktop-chromium', use: { viewport: { width: 1440, height: 900 }, browserName: 'chromium', launchOptions: { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' } } },
  ],
})

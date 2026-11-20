import assert from 'node:assert/strict'
import { chromium, webkit } from '@playwright/test'
import { auditStaticRibbonScroll } from './ribbon-state.mjs'

const url = new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000')
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
  throw new Error('Use a loopback URL to inspect the ribbon')
}

for (const engine of [webkit, chromium]) {
  const browser = await engine.launch(engine === chromium ? { executablePath: process.env.KIVORA_CHROME_EXECUTABLE } : {})
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3,
      isMobile: true, hasTouch: true, ignoreHTTPSErrors: true })
    await page.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort())
    await page.goto(url.href)
    await page.waitForSelector('[data-ribbon-mobile] [data-ribbon-clip] [data-ribbon-path]')
    await page.evaluate(() => document.fonts.ready)
    const state = await page.evaluate(auditStaticRibbonScroll)
    assert.equal(state.position, 'absolute')
    assert.equal(state.canvas, 0)
    assert.equal(state.strokes, 1)
    assert.equal(state.mutations, 0)
    assert.equal(state.samples, 11)
    assert.ok(state.drift < .01)
    assert.ok(state.clips > 0)
    assert.equal(state.visibility, 'visible')
    assert.equal(state.strokeDasharray, 'none')
    assert.equal(state.strokeDashoffset, '0px')
    console.log(JSON.stringify({ engine: engine.name(), ...state }))
  } finally {
    await browser.close()
  }
}

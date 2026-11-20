import { readRibbonState } from './ribbon-state.mjs'
import { chromium, webkit } from '@playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const base = process.env.MOTION_BASE_URL || 'http://localhost:3100'
const out = process.env.MOTION_OUTPUT || 'output/reference-motion-20261115/verification'
await fs.mkdir(out, { recursive: true })
const reports = []
for (const engine of (process.env.MOTION_ENGINES?.split(',') || ['chromium', 'webkit'])) for (const mobile of [false, true]) {
  const browser = await (engine === 'chromium' ? chromium : webkit).launch(engine === 'chromium' ? { channel: 'chrome' } : {})
  const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile })
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  const response = await page.goto(base, { waitUntil: 'networkidle' })
  assert.equal(response.status(), 200)
  await page.waitForTimeout(1600)
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
  // First interaction on a previously unseen group must not jump between
  // pointerdown and pointerup when focus completes its entrance animation.
  const firstVisitFAQ = page.locator('#faq details').first()
  await firstVisitFAQ.locator('summary').click()
  await page.waitForTimeout(650)
  assert.equal(await firstVisitFAQ.getAttribute('open'), '', 'First FAQ click works during entrance')
  await firstVisitFAQ.locator('summary').click()
  await page.waitForTimeout(650)
  const name = `${engine}-${mobile ? 'mobile' : 'desktop'}`
  const wave = page.locator('[data-art-scene="discovery"] [data-art-motion="illustration"]')
  await page.locator('[data-art-scene="discovery"]').scrollIntoViewIfNeeded()
  await page.waitForTimeout(150)
  const firstWave = await wave.evaluate(el => getComputedStyle(el).transform)
  await page.waitForTimeout(600)
  assert.notEqual(await wave.evaluate(el => getComputedStyle(el).transform), firstWave, 'The reviewed illustration moves intact without deforming its limbs')
  const ribbon = () => page.evaluate(readRibbonState)
  const initialPath = (await ribbon()).d
  assert(initialPath.startsWith(mobile ? 'M410 240C325 220 385 430 325 500S270 555 240 570' : 'M1460 100C1050 80 1270 420 1115 510S1140 720 815 720'), 'Approved path prefix retained')
  const positions = [0, .2, .4, .6, .8, 1]
  const down = [], up = []
  for (const fraction of positions) {
    await page.evaluate(f => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), fraction)
    await page.waitForTimeout(1000)
    assert.equal(await page.locator('[data-reveal]').evaluateAll(elements => elements.filter(element => {
      const rect = element.getBoundingClientRect()
      return rect.top < innerHeight * .9 && rect.bottom > 0 && Number(getComputedStyle(element).opacity) < .99
    }).length), 0, 'Content visible after entrance')
    down.push((await ribbon()).offset)
  }
  assert(down.at(-1) < 1 / await page.evaluate(() => devicePixelRatio), 'Ribbon reaches footer within one device pixel')
  const stoppedWave = await wave.evaluate(el => getComputedStyle(el).transform)
  await page.waitForTimeout(400)
  assert.equal(await wave.evaluate(el => getComputedStyle(el).transform), stoppedWave, 'Offscreen scene pauses')
  for (const fraction of positions.toReversed()) {
    await page.evaluate(f => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), fraction)
    await page.waitForTimeout(220)
    up.push((await ribbon()).offset)
  }
  assert(down.every((value, i) => i === 0 || value <= down[i - 1]), 'Ribbon moves forward')
  assert(up.every((value, i) => i === 0 || value >= up[i - 1]), 'Ribbon reverses')
  assert(down.every((value, i) => Math.abs(value - up[5 - i]) < 1), 'Ribbon stays synchronized at the same scroll position')

  const shell = page.locator('[data-story-card]').first()
  const cardStates = []
  for (const ratio of [.85, .4]) {
    await shell.evaluate((el, ratio) => scrollTo(0, el.parentElement.getBoundingClientRect().top + scrollY - innerHeight * ratio), ratio)
    await page.waitForTimeout(250)
    cardStates.push(await shell.evaluate(el => getComputedStyle(el).transform))
  }
  assert.notEqual(...cardStates, 'Paper card changes scale while entering')
  await page.getByRole('button', { name: 'A2 Base', exact: true }).click()
  assert(await page.getByText('Could I have a coffee, please?', { exact: false }).isVisible())
  await page.locator('#practice-demo').scrollIntoViewIfNeeded()
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: 'Montar', exact: true }).click()
  await page.waitForFunction(() => [...document.querySelectorAll('#practice-demo button')].some(el => el.textContent === 'Montar' && el.getAttribute('aria-pressed') === 'true'))
  for (const text of ['Can I have', 'a coffee,', 'please?']) await page.locator('#practice-demo').getByRole('button', { name: text, exact: true }).click()
  await page.getByRole('button', { name: 'Verificar frase', exact: true }).click()
  assert(await page.getByText('abre um pedido educado.', { exact: false }).isVisible())
  await page.getByRole('button', { name: 'Relembrar', exact: true }).click()
  await page.getByRole('button', { name: 'Revelar significado', exact: true }).click()
  assert(await page.getByText('um pouco mais perto', { exact: true }).isVisible())
  await page.getByRole('button', { name: 'Escolher', exact: true }).click()

  const faq = page.locator('#faq details').first()
  await faq.locator('summary').click()
  await page.waitForTimeout(650)
  assert.equal(await faq.getAttribute('open'), '')
  assert(await faq.locator('p').isVisible())
  await faq.locator('summary').click()
  await page.waitForTimeout(80)
  await faq.locator('summary').click()
  await page.waitForTimeout(650)
  assert.equal(await faq.getAttribute('open'), '', 'FAQ survives interrupted animation')
  await page.screenshot({ path: `${out}/${name}-faq.png` })
  await faq.locator('summary').click()
  await page.waitForTimeout(650)

  for (const size of [{ width: 320, height: 568 }, { width: 844, height: 390 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(size)
    await page.waitForTimeout(500)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `No overflow at ${size.width}`)
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(350)
    // WebKit can finish a resize-triggered layout/ScrollTrigger refresh after
    // the first scroll. Reach the physical bottom of that settled layout.
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(350)
    const endState = await ribbon()
    assert(endState.offset < 2, 'Ribbon reaches the hidden tail within viewport pixel rounding')
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => scrollTo(0, 0))
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click()
  await page.waitForTimeout(800)
  assert(await page.locator('dialog[open]').isVisible())
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab')
    assert(await page.locator('dialog').evaluate(el => el.contains(document.activeElement)))
  }
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  assert.equal(await page.locator('dialog[open]').count(), 0)
  assert(await page.getByRole('button', { name: 'Abrir menu', exact: true }).evaluate(el => el === document.activeElement))

  const free = page.locator('[data-landing-plan="standard"]')
  // A sticky card may already be under the next card. Return to the stack's
  // document position, as a user scrolling upward would, before choosing Free.
  await page.locator('[data-plan-stack]').evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - 105))
  await page.waitForTimeout(300)
  await free.getByRole('link', { name: 'Começar grátis', exact: true }).click({ trial: true })
  const pro = page.locator('[data-landing-plan="featured"]')
  await pro.scrollIntoViewIfNeeded()
  await pro.getByRole('link', { name: 'Assinar Pro', exact: true }).click({ trial: true })
  assert.equal(await pro.getByRole('link', { name: 'Assinar Pro', exact: true }).getAttribute('href'), '/register?plan=pro')
  await page.screenshot({ path: `${out}/${name}-stack.png` })

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => scrollTo(0, 0))
  await page.waitForTimeout(350)
  const allMotion = () => page.locator('[data-art-motion],[data-journey-prop],[data-word-belt],[data-hero-parallax],[data-title-line]').evaluateAll(elements => elements.map(el => `${el.getAttribute('transform')}|${getComputedStyle(el).transform}`))
  const reduced = await allMotion()
  await page.waitForTimeout(400)
  assert.deepEqual(await allMotion(), reduced, 'Reduced motion stops all scene loops and decorative travel')
  assert.equal(await page.locator('[data-reveal]').evaluateAll(elements => elements.filter(el => Number(getComputedStyle(el).opacity) < 1).length), 0)
  await page.screenshot({ path: `${out}/${name}-reduced.png` })
  await page.reload({ waitUntil: 'networkidle' })
  const reducedAtLoad = await allMotion()
  await page.waitForTimeout(400)
  assert.deepEqual(await allMotion(), reducedAtLoad, 'Reduced motion respected from initial load')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.locator('[data-art-scene="discovery"]').scrollIntoViewIfNeeded()
  await page.waitForTimeout(1500)
  const resumed = await wave.evaluate(el => getComputedStyle(el).transform)
  await page.waitForTimeout(400)
  assert.notEqual(await wave.evaluate(el => getComputedStyle(el).transform), resumed, 'Motion can resume without a reload')
  const images = await page.locator('[data-art-scene] img').evaluateAll(images => images.map(image => ({src:image.currentSrc,loaded:image.complete && image.naturalWidth > 0})))
  assert(images.every(image => image.loaded && /\.(jxl|avif)$/.test(image.src)), 'Generated artwork loads in JXL or AVIF compatibility format')
  assert.deepEqual(errors, [])
  reports.push({ name, down, up, animatedScene: true, offscreenPaused: true, cardScale: cardStates, images, interactions: true, resize: true, reducedMotion: true, consoleErrors: errors })
  console.log(`${name}: passed`)
  await browser.close()
}
await fs.writeFile(`${out}/results.json`, JSON.stringify(reports, null, 2))

import { expect, test, type Locator } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(/kivora-landing-scroll/)
})

test('um caminho desenha e retrai com o scroll, inclusive no toque', async ({ page }) => {
  const path = page.locator('[data-ribbon-path]')
  await expect(path).toHaveCount(1)
  const length = () => path.evaluate(el => {
    const dash = getComputedStyle(el).strokeDasharray
    return dash === 'none' ? (el as unknown as SVGPathElement).getTotalLength() : parseFloat(dash)
  })
  await expect.poll(length).toBeGreaterThan(0)
  const start = await length()
  await page.locator('#faq').evaluate(el => el.scrollIntoView())
  await expect.poll(length).toBeGreaterThan(start * 2)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect.poll(length).toBeLessThan(start + 2)
})

test('movimento reduzido mantém o caminho completo após abrir FAQ e girar a tela', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const path = page.locator('[data-ribbon-path]')
  const check = async () => {
    await expect(path).toHaveCSS('stroke-dasharray', 'none')
    const covers = () => path.evaluate(el => {
      const svg = el.closest('svg')!, main = el.closest('main')!
      const faq = main.querySelector('#faq')!
      return Math.abs(svg.clientWidth - main.clientWidth) <= 1
        && svg.getBoundingClientRect().bottom >= faq.getBoundingClientRect().bottom
    })
    await expect.poll(covers).toBe(true)
  }
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport)
    await check()
    await page.locator('details summary').first().click()
    await check()
  }
})

test('abrir e fechar respostas preserva a curva do caminho', async ({ page, hasTouch }) => {
  const path = page.locator('[data-ribbon-path]')
  const faq = page.locator('#faq')
  const firstSummary = await faq.locator('summary').first().elementHandle()
  if (hasTouch) {
    // Start a gesture on the native control before the observer loads the animated list.
    await firstSummary.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', isPrimary: true })
  }
  await faq.evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }))
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  const scale = () => path.evaluate(element => (element as unknown as SVGPathElement).getScreenCTM()!.d)
  const closedScale = await scale()
  const summaries = await faq.locator('summary').all()
  const activate = async (summary: Locator) => {
    await summary.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
    if (hasTouch) await summary.tap()
    else await summary.click()
  }

  for (const summary of summaries) {
    await activate(summary)
    await expect(summary.locator('..')).toHaveAttribute('open', '')
    await expect.poll(scale).toBeCloseTo(closedScale, 5)
  }
  const ribbonBottom = await path.evaluate(element => element.closest('svg')!.getBoundingClientRect().bottom)
  const faqBox = (await faq.boundingBox())!
  expect(ribbonBottom).toBeGreaterThan(faqBox.y + faqBox.height)
  for (const summary of summaries.reverse()) {
    await activate(summary)
    await expect(summary.locator('..')).not.toHaveAttribute('open')
    await expect.poll(scale).toBeCloseTo(closedScale, 5)
  }
  if (hasTouch) {
    const sameControl = () => firstSummary.evaluate(element => element === document.querySelector('#faq summary'))
    expect(await sameControl()).toBe(true)
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
    await expect.poll(sameControl).toBe(false)
  }
})

import { expect, test } from '@playwright/test'

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
    const covers = await path.evaluate(el => {
      const svg = el.closest('svg')!, main = el.closest('main')!
      return Math.abs(svg.clientHeight - main.offsetHeight) <= 1
    })
    expect(covers).toBe(true)
  }
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport)
    await check()
    await page.locator('details summary').first().click()
    await check()
  }
})

import { expect, test, type Locator, type Page } from '@playwright/test'

function usesSmoothScroll(page: Page) {
  return page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches)
}

function anchorOffset(section: Locator) {
  return section.evaluate(el => Math.abs(el.getBoundingClientRect().top - parseFloat(getComputedStyle(el).scrollMarginTop)))
}

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(/kivora-landing-scroll/)
})

test('âncora, margem, histórico e retorno à landing', async ({ page }) => {
  const html = page.locator('html')
  if (await usesSmoothScroll(page)) await expect(html).toHaveClass(/\blenis\b/)
  else await expect(html).not.toHaveClass(/\blenis\b/)
  await page.locator('a[href="#seu-caminho"]:visible').first().click()
  const section = page.locator('#seu-caminho')
  await expect(page).toHaveURL(/#seu-caminho$/)
  await expect.poll(() => anchorOffset(section)).toBeLessThan(3)
  if (await usesSmoothScroll(page)) await expect(section).toBeFocused()
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await page.goForward()
  await expect(page).toHaveURL(/#seu-caminho$/)
  await page.locator('footer a[href="/terms"]').click()
  await expect(html).not.toHaveClass(/kivora-landing-scroll|\blenis\b/)
  await page.goBack()
  await expect(html).toHaveClass(/kivora-landing-scroll/)
})

test('menu estreito protege a rolagem e devolve foco e navegação', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 450 })
  const button = page.getByRole('button', { name: 'Abrir menu' })
  await button.click()
  const dialog = page.locator('dialog[open][data-lenis-prevent]')
  await expect(dialog).toBeVisible()
  if (await usesSmoothScroll(page)) await expect(page.locator('html')).toHaveClass(/lenis-stopped/)
  await dialog.evaluate(el => { el.scrollTop = 200 })
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(button).toBeFocused()
  await button.click()
  await dialog.locator('a[href="#faq"]').click()
  await expect(page).toHaveURL(/#faq$/)
  await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/)
  await expect.poll(() => anchorOffset(page.locator('#faq'))).toBeLessThan(4)
})

test('movimento reduzido preserva teclado e FAQ nativos', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('html')).not.toHaveClass(/\blenis\b/)
  const item = page.locator('#faq details').first()
  await item.locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(item).toHaveAttribute('open', '')
  await page.keyboard.press('Enter')
  await expect(item).not.toHaveAttribute('open', '')
})

import { expect, test } from '@playwright/test'
import { assertNoHorizontalOverflow } from './support/layout'

test.describe('Kivora public experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Seu inglês.')
  })

  test('renders without runtime errors and keeps the primary route', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.reload({ waitUntil: 'networkidle' })
    await page.locator('.editorial-hero').getByRole('link', { name: 'Começar grátis' }).click()
    await expect(page).toHaveURL(/\/register$/)
    await page.goBack()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Seu inglês.')
    await page.goForward()
    await expect(page).toHaveURL(/\/register$/)
    expect(errors).toEqual([])
  })

  test('menu traps focus and returns it at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    const menu = page.getByRole('button', { name: 'Abrir menu', exact: true })
    await menu.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Conheça a Kivora' })
    await expect(dialog.getByRole('link', { name: 'Entrar', exact: true })).toBeVisible()
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(menu).toBeFocused()
    await assertNoHorizontalOverflow(page, 'landing at 320px')
  })

  test('demo changes context and reveals the answer immediately', async ({ page }) => {
    await page.getByRole('button', { name: 'No trabalho', exact: true }).click()
    await expect(page.getByText('Let’s take it one step at a time.', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Ver tradução', exact: true }).click()
    await expect(page.getByText('Vamos dar um passo de cada vez.', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Tentar de novo', exact: true }).click()
    await expect(page.getByText('Como você diria em português?')).toBeVisible()
    await expect(page.getByText('Demonstração', { exact: true })).toBeVisible()
  })

  test('carousel works with keyboard and stops at either end', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const rail = page.getByRole('region', { name: 'Formas de praticar' })
    await rail.scrollIntoViewIfNeeded()
    await rail.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.editorial-rail-status')).toContainText('02')
    await page.getByRole('button', { name: 'Próxima prática' }).click()
    await page.getByRole('button', { name: 'Próxima prática' }).click()
    await expect(page.getByRole('button', { name: 'Próxima prática' })).toBeDisabled()
    await page.getByRole('button', { name: 'Prática anterior' }).click()
    await expect(page.getByRole('button', { name: 'Próxima prática' })).toBeEnabled()
  })

  test('prices and FAQ retain their actions', async ({ page }) => {
    const pricing = page.locator('#precos')
    await pricing.scrollIntoViewIfNeeded()
    await expect(pricing.locator('article')).toHaveCount(2)
    await expect(pricing.getByRole('link', { name: /Assinar Pro/ })).toHaveAttribute('href', '/register?plan=pro')
    const faq = page.getByRole('button', { name: 'Como funciona o AI Tutor?' })
    await faq.click()
    await expect(faq).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('region', { name: 'Como funciona o AI Tutor?' })).toContainText('Converse por voz ou texto')
    await faq.click()
    await expect(faq).toHaveAttribute('aria-expanded', 'false')
  })

  test('reduced motion and resize keep text and controls available', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const [width, height] of [[1440,900], [834,1194], [390,844], [320,568], [844,390]]) {
      await page.setViewportSize({ width, height })
      await page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
      await assertNoHorizontalOverflow(page, `landing ${width}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    }
    expect(await page.evaluate(() => document.getAnimations().filter(a => a.effect?.getTiming().iterations === Infinity).length)).toBe(0)
    await expect(page.getByText('Ativar lembretes', { exact: true })).toHaveCount(0)
  })

  test('content and signup links work without JavaScript', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 568 } })
    const page = await context.newPage()
    await page.goto(baseURL!)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.locator('.editorial-hero').getByRole('link', { name: 'Começar grátis' }).click()
    await expect(page).toHaveURL(/\/register$/)
    await context.close()
  })
})

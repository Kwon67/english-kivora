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
    await page.locator('a[href="/register"]:visible').filter({hasText: 'Começar grátis'}).first().click()
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
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('link', { name: 'Já tenho uma conta', exact: true })).toBeVisible()
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
    await page.getByRole('button', { name: 'Relembrar', exact: true }).click()
    await page.getByRole('button', { name: 'Revelar significado' }).click()
    await expect(page.getByText('um pouco mais perto', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Experimentar de novo' }).click()
    await expect(page.getByRole('button', { name: 'Revelar significado' })).toBeVisible()
  })

  test('trilha funciona por teclado e para nos extremos', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const buttons = page.locator('button[aria-controls="level-example"]')
    await buttons.first().focus()
    await page.keyboard.press('ArrowRight')
    await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('End')
    await page.keyboard.press('ArrowRight')
    await expect(buttons.last()).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Home')
    await expect(buttons.first()).toHaveAttribute('aria-pressed', 'true')
  })

  test('planos e FAQ mantêm suas ações', async ({ page }) => {
    const pricing = page.locator('#precos')
    await expect(pricing.locator('article')).toHaveCount(2)
    await expect(pricing.getByText('Em breve')).toBeVisible()
    await expect(pricing.getByRole('link')).toHaveAttribute('href', '/register')
    const faq = page.locator('details').filter({ hasText: 'Como funciona o AI Tutor?' })
    await faq.locator('summary').click()
    await expect(faq).toHaveAttribute('open', '')
    await expect(faq.locator('p')).toContainText('converse por voz ou texto')
    await faq.locator('summary').click()
    await expect(faq).not.toHaveAttribute('open', '')
  })

  test('um novo toque durante a saída do FAQ reabre a mesma resposta sem salto', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 })
      Object.defineProperty(navigator, 'deviceMemory', { value: 8 })
      Object.defineProperty(navigator, 'connection', { value: undefined })
    })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.reload()
    const item = page.locator('#faq details').first()
    const summary = item.locator('summary')
    const native = await summary.elementHandle()
    await summary.scrollIntoViewIfNeeded()
    await expect.poll(() => native.evaluate(node => node.isConnected)).toBe(false)
    await summary.focus()
    await page.keyboard.press('Enter')
    const answer = item.locator('[data-faq-answer]')
    await expect(item).toHaveAttribute('open', '')
    await expect(answer).not.toHaveAttribute('style', /height:|opacity:/)

    const reversal = await item.evaluate(async details => {
      const trigger = details.querySelector('summary')!
      const answer = details.querySelector<HTMLElement>('[data-faq-answer]')!
      trigger.click()
      const start = performance.now()
      while (performance.now() - start < 1200) {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
        const opacity = Number(getComputedStyle(answer).opacity)
        if (opacity <= 0 || opacity >= 1) continue
        const closing = trigger.getAttribute('aria-expanded')
        const before = answer.getBoundingClientRect().height
        trigger.click()
        return { closing, opening: trigger.getAttribute('aria-expanded'), jump: Math.abs(answer.getBoundingClientRect().height - before) }
      }
      throw new Error('A resposta não apresentou um quadro intermediário de saída')
    })
    expect(reversal).toEqual({ closing: 'false', opening: 'true', jump: 0 })
    await expect(answer).not.toHaveAttribute('style', /height:|opacity:/)
    await expect(item).toHaveAttribute('open', '')
    await expect(answer).not.toHaveAttribute('aria-hidden')
    await expect(summary).toBeFocused()
    await page.keyboard.press('Space')
    await expect(item).not.toHaveAttribute('open')
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
    await page.locator('a[href="/register"]:visible').filter({hasText: 'Começar grátis'}).first().click()
    await expect(page).toHaveURL(/\/register$/)
    await context.close()
  })
})

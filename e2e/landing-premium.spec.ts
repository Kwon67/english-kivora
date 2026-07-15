import { expect, test } from '@playwright/test'
import { assertNoHorizontalOverflow } from './support/layout'

test.describe('Premium landing page', () => {
  test('opens without hydration or runtime errors', async ({ page }) => {
    const runtimeErrors: string[] = []
    page.on('pageerror', (error) => runtimeErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(message.text())
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Pratique o inglês')
    expect(runtimeErrors).toEqual([])
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Pratique o inglês')
  })

  test('hero demonstrates a contextual practice', async ({ page }) => {
    await page.getByRole('button', { name: 'Reunião' }).click()
    await expect(page.getByLabel('O que você quer praticar?')).toHaveValue(
      'Quero apresentar uma ideia em uma reunião',
    )

    await page.getByRole('button', { name: 'Praticar', exact: true }).click()
    await expect(page.getByText('This idea can make the process faster.')).toBeVisible({
      timeout: 8_000,
    })
    await expect(page.getByText('+120 XP')).toBeVisible()
  })

  test('interactive sections expose clear controls and states', async ({ page }) => {
    const audience = page.locator('#para-quem')
    await audience.scrollIntoViewIfNeeded()
    await page.getByRole('tab', { name: 'Quero refinar' }).click()
    await expect(page.getByRole('tabpanel')).toContainText('Precisão e naturalidade')

    const reviewStep = page.getByRole('button', { name: /Revise antes de esquecer/ })
    await reviewStep.click()
    await expect(reviewStep).toHaveAttribute('aria-expanded', 'true', { timeout: 2_000 })
    await expect(page.getByText('O que precisa voltar agora').filter({ visible: true })).toBeVisible()

    const stories = page.locator('#depoimentos')
    await stories.scrollIntoViewIfNeeded()
    await page.getByRole('button', { name: 'Próximo depoimento' }).click()
    await expect(stories.getByText('02 / 03')).toBeVisible()

    const faqButton = page.getByRole('button', { name: 'Como funciona o AI Tutor?' })
    await faqButton.scrollIntoViewIfNeeded()
    await faqButton.click()
    await expect(faqButton).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('region', { name: 'Como funciona o AI Tutor?' })).toBeVisible()
  })

  test('testimonial deck rotates automatically and can be paused', async ({ page }) => {
    const stories = page.locator('#depoimentos')
    await stories.scrollIntoViewIfNeeded()
    await page.mouse.move(0, 0)
    await expect(stories.getByText('01 / 03')).toBeVisible()
    await expect(stories.getByText('02 / 03')).toBeVisible({ timeout: 7_000 })

    await page.getByRole('button', { name: 'Pausar rotação dos depoimentos' }).click()
    await expect(page.getByRole('button', { name: 'Iniciar rotação dos depoimentos' })).toBeVisible()
  })

  test('plans remain comparable and layout does not overflow', async ({ page }) => {
    await page.locator('#precos').scrollIntoViewIfNeeded()
    await expect(page.locator('#precos article')).toHaveCount(2)
    await expect(page.locator('#precos article').filter({ hasText: 'Plano Free' })).toBeVisible()
    await expect(page.locator('#precos article').filter({ hasText: 'Plano Pro' })).toBeVisible()
    await assertNoHorizontalOverflow(page, 'landing page')
  })

  test('reduced motion keeps content available without continuous animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload({ waitUntil: 'networkidle' })
    await page.locator('#faq').scrollIntoViewIfNeeded()
    await expect(page.getByRole('heading', { name: 'Tem perguntas? Temos respostas!' })).toBeVisible()

    const infiniteAnimations = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations === Infinity).length,
    )
    expect(infiniteAnimations).toBe(0)
  })
})

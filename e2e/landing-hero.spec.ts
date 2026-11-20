import { expect, test } from '@playwright/test'
import { assertNoHorizontalOverflow } from './support/layout'

test('etiquetas respondem ao ponteiro e o CTA continua navegável', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Ponteiro fino')
  await page.goto('/')
  const label = page.locator('[data-hero-parallax] [data-float] [data-cursor]').first()
  const box = await label.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await expect.poll(() => label.evaluate(el => getComputedStyle(el).transform)).not.toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/)
  await page.locator('[data-magnetic]').click()
  await expect(page).toHaveURL(/\/register$/)
})

test('o poster acompanha a preferência de movimento em tempo real', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const hero = page.locator('[data-art-scene="discovery"]')
  await expect(hero.locator('img')).toBeVisible()
  await expect(hero.locator('canvas')).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(hero.locator('[data-rive-ready=true]')).toHaveCount(1, { timeout: 15_000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(hero.locator('canvas')).toHaveCount(0)
  await assertNoHorizontalOverflow(page, 'hero')
})

test('falha do arquivo Rive preserva a ilustração e a prática', async ({ page }) => {
  await page.route('**/*.riv', route => route.abort())
  await page.goto('/')
  await expect(page.locator('[data-art-scene="discovery"] img')).toBeVisible()
  await page.getByRole('button', { name: 'Relembrar', exact: true }).click()
  await page.getByRole('button', { name: 'Revelar significado' }).click()
  await expect(page.getByText('um pouco mais perto', { exact: true })).toBeVisible()
})

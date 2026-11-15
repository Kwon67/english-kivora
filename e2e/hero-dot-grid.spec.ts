import { expect, test } from '@playwright/test'
import { assertNoHorizontalOverflow } from './support/layout'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Seu inglês.')
})

test('desktop grid reacts to the cursor and click without covering controls', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Mouse interaction is intentionally disabled on touch devices')
  const grid = page.locator('[data-hero-dot-grid]')
  const canvas = grid.locator('canvas[data-ready]')
  await expect(canvas).toBeVisible()
  const bounds = (await grid.boundingBox())!
  const x = bounds.x + bounds.width * 0.45
  const y = bounds.y + 38
  const resting = await canvas.screenshot()
  await page.mouse.move(x - 80, y)
  await page.mouse.move(x, y, { steps: 12 })
  expect((await canvas.screenshot()).equals(resting)).toBe(false)
  await page.mouse.move(0, 0)
  // Let the spring settle, then isolate the click wave from cursor motion.
  await page.waitForTimeout(2000)
  await page.mouse.move(x, y)
  await page.waitForTimeout(1000)
  const beforeClick = await canvas.screenshot()
  await page.mouse.click(x, y)
  await page.waitForTimeout(80)
  expect((await canvas.screenshot()).equals(beforeClick)).toBe(false)

  await page.getByRole('button', { name: 'Ver tradução', exact: true }).click()
  await expect(page.getByText('Um café, por favor.', { exact: true })).toBeVisible()
  await page.locator('.editorial-hero').getByRole('link', { name: 'Explorar', exact: true }).click()
  await expect(page).toHaveURL(/#como-funciona$/)
  await page.locator('.editorial-hero').getByRole('link', { name: 'Começar grátis' }).click()
  await expect(page).toHaveURL(/\/register$/)
})

test('touch devices keep a static grid and usable demo controls', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Requires touch emulation')
  const grid = page.locator('[data-hero-dot-grid]')
  await expect(grid).toBeVisible()
  await expect(grid.locator('canvas')).toHaveCount(0)
  await page.getByRole('button', { name: 'No trabalho', exact: true }).tap()
  await expect(page.getByText('Let’s take it one step at a time.', { exact: true })).toBeVisible()
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  const bounds = (await grid.boundingBox())!
  const clip = { x: bounds.x, y: bounds.y + 5, width: bounds.width, height: 25 }
  const before = await page.screenshot({ clip })
  await page.touchscreen.tap(bounds.x + 20, bounds.y + 20)
  expect((await page.screenshot({ clip })).equals(before)).toBe(true)
  await page.getByRole('button', { name: 'Ver tradução', exact: true }).tap()
  await expect(page.getByText('Vamos dar um passo de cada vez.', { exact: true })).toBeVisible()
  await assertNoHorizontalOverflow(page, 'static touch hero')
})

test('reduced motion stays static and responds to preference changes', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const grid = page.locator('[data-hero-dot-grid]')
  await expect(grid.locator('canvas')).toHaveCount(0)
  await page.getByRole('button', { name: 'No trabalho', exact: true }).click()
  await expect(page.getByText('Let’s take it one step at a time.', { exact: true })).toBeVisible()
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  const bounds = (await grid.boundingBox())!
  const clip = { x: bounds.x, y: bounds.y + 5, width: bounds.width, height: 25 }
  const before = await page.screenshot({ clip })
  await page.mouse.click(bounds.x + 20, bounds.y + 20)
  expect((await page.screenshot({ clip })).equals(before)).toBe(true)
  for (const width of [1440, 834, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await assertNoHorizontalOverflow(page, `dot grid at ${width}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  if (!isMobile) {
    await expect(grid.locator('canvas[data-ready]')).toBeVisible()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(grid.locator('canvas')).toHaveCount(0)
  }
})

test('keeps the CSS grid when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl2') return null
      return Reflect.apply(getContext, this, [type, ...args])
    } as typeof getContext
  })
  await page.reload()
  const grid = page.locator('[data-hero-dot-grid]')
  const fallback = grid.locator(':scope > div').first()
  await expect(fallback).toHaveCSS('visibility', 'visible')
  await expect(fallback).not.toHaveCSS('background-image', 'none')
  await page.locator('.editorial-hero').getByRole('link', { name: 'Começar grátis' }).click()
  await expect(page).toHaveURL(/\/register$/)
})

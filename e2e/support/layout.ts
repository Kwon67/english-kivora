import { expect, type Page } from '@playwright/test'

export async function assertNoHorizontalOverflow(page: Page, label: string) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))

  const overflow = metrics.scrollWidth - metrics.clientWidth
  expect(overflow, `${label} should not overflow horizontally`).toBeLessThanOrEqual(2)
}

export async function assertOnboardingChrome(page: Page) {
  await expect(page.getByTestId('onboarding-wizard')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('Kivora English', { exact: true })).toBeVisible()
  await expect(page.locator('.stitch-mobile-nav')).toHaveCount(0)
}

export async function assertOnboardingFillsViewport(page: Page) {
  const metrics = await page.getByTestId('onboarding-wizard').evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const style = window.getComputedStyle(element)
    return {
      bottom: rect.bottom,
      height: rect.height,
      viewportHeight: window.innerHeight,
      backgroundColor: style.backgroundColor,
    }
  })

  expect(metrics.bottom, 'onboarding background should reach the viewport bottom').toBeGreaterThanOrEqual(
    metrics.viewportHeight - 2
  )
  expect(metrics.height, 'onboarding shell should occupy meaningful mobile height').toBeGreaterThan(
    metrics.viewportHeight * 0.75
  )
  expect(metrics.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
}

export async function assertPrimaryActionsFitViewport(page: Page) {
  const buttons = page.locator('button:visible')
  const count = await buttons.count()

  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index)
    const box = await button.boundingBox()
    if (!box) continue

    const viewport = page.viewportSize()
    if (!viewport) continue

    expect(box.x).toBeGreaterThanOrEqual(-1)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
  }
}

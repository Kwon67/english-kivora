import { expect, test } from '@playwright/test'

for (const [width, height] of [[390, 844], [768, 1024], [1440, 900]]) {
  test(`landing em ${width}px`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Seu inglês.')
    await page.evaluate(async () => {
      await document.fonts.ready
      await Promise.all(Array.from(document.images, async image => {
        image.loading = 'eager'
        await image.decode()
      }))
    })
    await expect(page).toHaveScreenshot(`landing-${width}.png`, { fullPage: true })
    expect(errors).toEqual([])
  })
}

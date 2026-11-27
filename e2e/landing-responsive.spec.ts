import { expect, test } from '@playwright/test'

for (const width of [320, 390, 768, 1440]) {
  test('controles cabem na página em ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
    await page.locator('#practice-recall').click()
    await page.getByRole('button', { name: 'Revelar significado' }).click()
    const clipped = await page.locator('#inicio :is(a,button,input,summary)').evaluateAll(controls =>
      controls.filter(el => {
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1)
      }).map(el => el.textContent))
    expect(clipped).toEqual([])
  })
}

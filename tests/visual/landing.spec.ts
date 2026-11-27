import { expect, test } from '@playwright/test'

for (const [width, height] of [[390, 844], [768, 1024], [1440, 900]]) {
  test('paleta e composição editorial em ' + width + 'px', async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await expect(page.locator('header')).toHaveCSS('background-color', 'rgb(243, 236, 218)')
    await expect(page.locator('h1')).toHaveCSS('color', 'rgb(39, 41, 40)')
    await expect(page.getByRole('link', { name: 'Começar grátis' }).first()).toHaveCSS('background-color', 'rgb(61, 99, 77)')
    await page.evaluate(async () => {
      await document.fonts.ready
      await Promise.all(Array.from(document.images, image => {
        image.loading = 'eager'
        return image.decode()
      }))
    })
    await expect(page.locator('#inicio img[src*="/images/editorial/"]')).toHaveCount(7)
    const capture = await page.screenshot({ fullPage: true })
    await testInfo.attach('Landing ' + width, { body: capture, contentType: 'image/png' })
    expect(capture).toMatchSnapshot('editorial-' + width + '.png', { maxDiffPixelRatio: 0.005 })
  })
}
